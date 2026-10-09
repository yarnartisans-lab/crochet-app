'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function EditPattern() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form data states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [hookSize, setHookSize] = useState('');
  const [yarn, setYarn] = useState('');
  const [category, setCategory] = useState('Garments');
  const [language, setLanguage] = useState('English');
  const [materials, setMaterials] = useState('');
  const [abbreviations, setAbbreviations] = useState('');
  const [rawText, setRawText] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  
  // Multi-Image states
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{file: Blob, preview: string}[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const parsedRows = rawText.split('\n').filter(line => line.trim() !== '');

  // 1. Fetch Existing Data on Load
  useEffect(() => {
    async function fetchExistingPattern() {
      if (!params.id) return;
      
      const { data: pattern } = await supabase
        .from('patterns')
        .select('*')
        .eq('id', params.id)
        .single();

      if (pattern) {
        setTitle(pattern.title || '');
        setSlug(pattern.slug || '');
        setDifficulty(pattern.difficulty_level || 'Beginner');
        setHookSize(pattern.hook_size || '');
        setYarn(pattern.yarn_weight || '');
        setCategory(pattern.category || 'Garments');
        setLanguage(pattern.language || 'English');
        setMaterials(pattern.materials || '');
        setAbbreviations(pattern.abbreviations || '');
        setAffiliateLink(pattern.affiliate_link || '');
        setYoutubeLink(pattern.video_link || '');
        
        // Load existing images
        if (pattern.image_urls && pattern.image_urls.length > 0) {
          setExistingImages(pattern.image_urls);
        } else if (pattern.image_url) {
          setExistingImages([pattern.image_url]);
        }

        // Fetch instructions and rebuild the raw text box
        const { data: steps } = await supabase
          .from('pattern_steps')
          .select('*')
          .eq('pattern_id', pattern.id)
          .order('step_number', { ascending: true });

        if (steps && steps.length > 0) {
          const rebuiltText = steps.map(s => s.instruction).join('\n');
          setRawText(rebuiltText);
        }
      }
      setIsLoading(false);
    }
    
    fetchExistingPattern();
  }, [params.id]);

  // Image handling
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCurrentImages = existingImages.length + newImages.length;
    
    if (totalCurrentImages + files.length > 4) {
      alert("You can only have up to 4 images total.");
      return;
    }

    setIsCompressing(true);
    const compressedFiles: {file: Blob, preview: string}[] = [];

    for (const file of files) {
      const compressedImage = await new Promise<{file: Blob, preview: string}>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) {
                resolve({ file: blob, preview: URL.createObjectURL(blob) });
              }
            }, 'image/webp', 0.8);
          };
        };
      });
      compressedFiles.push(compressedImage);
    }

    setNewImages(prev => [...prev, ...compressedFiles]);
    setIsCompressing(false);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  // 2. Handle the Update
  const handleUpdate = async () => {
    setIsPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      let finalUrls = [...existingImages];

      // Upload newly added images with SEO-friendly filenames
      const baseName = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'crochet-pattern';
      const imageSuffixes = ['main-crochet-pattern', 'detail-view', 'materials-step', 'finished-craft'];

      for (let i = 0; i < newImages.length; i++) {
        const slot = existingImages.length + i;
        const semanticLabel = imageSuffixes[slot] || `photo-${slot + 1}`;
        const uniqueSuffix = Date.now().toString().slice(-4);
        const fileName = `${baseName}-${semanticLabel}-${uniqueSuffix}.webp`;

        const { error: uploadError } = await supabase.storage
          .from('pattern_images')
          .upload(fileName, newImages[i].file, { contentType: 'image/webp' });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('pattern_images').getPublicUrl(fileName);
          finalUrls.push(publicUrlData.publicUrl);
        }
      }

      const mainImageUrl = finalUrls.length > 0 ? finalUrls[0] : null;

      // Update main pattern record
      const { error: patternError } = await supabase
        .from('patterns')
        .update({
          title: title || 'Untitled Pattern',
          difficulty_level: difficulty,
          hook_size: hookSize,
          yarn_weight: yarn,
          category: category,
          language: language,
          materials: materials,
          abbreviations: abbreviations,
          affiliate_link: affiliateLink,
          video_link: youtubeLink,
          image_url: mainImageUrl, 
          image_urls: finalUrls,   
        })
        .eq('id', params.id);

      if (patternError) throw patternError;

      // Update Instructions 
      if (parsedRows.length > 0) {
        await supabase.from('pattern_steps').delete().eq('pattern_id', params.id);

        const stepsToInsert = parsedRows.map((instruction, index) => ({
          pattern_id: params.id,
          step_number: index + 1,
          instruction: instruction.trim(),
          section_name: 'Main'
        }));

        await supabase.from('pattern_steps').insert(stepsToInsert);
      }

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Update error:", error.message);
      alert("Error updating pattern. Check console.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">Loading pattern data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]">← Cancel</Link>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-[#D97757]' : 'bg-gray-200'}`}></span>
          <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-[#D97757]' : 'bg-gray-200'}`}></span>
          <span className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-[#D97757]' : 'bg-gray-200'}`}></span>
        </div>
        <button className="text-sm font-semibold text-[#D97757]">Editing Pattern</button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        
        {/* STEP 1: Basics */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-8 animation-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Update the basics.</h1>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Photos ({existingImages.length + newImages.length}/4)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* Existing Images */}
                  {existingImages.map((url, index) => (
                    <div key={`exist-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group">
                      <img src={url} alt="Saved" className="w-full h-full object-cover" />
                      <button onClick={() => removeExistingImage(index)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Newly Uploaded Images */}
                  {newImages.map((img, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-400 group">
                      <img src={img.preview} alt="New Preview" className="w-full h-full object-cover opacity-80" />
                      <button onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  {(existingImages.length + newImages.length) < 4 && (
                    <label className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#D97757] hover:bg-[#D97757]/5 transition-colors bg-gray-50">
                      <span className="text-xs font-semibold text-gray-500 text-center px-2">
                        {isCompressing ? 'Processing...' : '+ Add Photo'}
                      </span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} disabled={isCompressing} />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Pattern Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]">
                    <option value="Beginner">Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Hook Size</label>
                  <input type="text" value={hookSize} onChange={(e) => setHookSize(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Yarn Weight & Brand</label>
                <input type="text" value={yarn} onChange={(e) => setYarn(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]" />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Pattern Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]">
                    <option value="Garments">Garments (Sweaters, Tops)</option>
                    <option value="Accessories">Accessories (Hats, Bags)</option>
                    <option value="Amigurumi / Plushies">Amigurumi / Plushies</option>
                    <option value="Home Decor">Home Decor</option>
                    <option value="Blankets">Blankets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]">
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Italian">Italian</option>
                    <option value="Dutch">Dutch</option>
                    <option value="Portuguese">Portuguese</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Materials Needed</label>
                  <textarea 
                    value={materials} 
                    onChange={(e) => setMaterials(e.target.value)} 
                    placeholder="e.g. 5mm hook, scissors, stitch markers, 2 skeins of yarn..." 
                    rows={3} 
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Abbreviations & Stitches</label>
                  <textarea 
                    value={abbreviations} 
                    onChange={(e) => setAbbreviations(e.target.value)} 
                    placeholder="e.g. sc = single crochet, inc = increase, dec = decrease..." 
                    rows={3} 
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] resize-none"
                  />
                </div>
              </div>

              <button 
                onClick={() => setStep(2)} 
                disabled={!title}
                className="w-full rounded-md bg-[#2D2D2D] py-3 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:opacity-50 mt-4 transition-colors"
              >
                Continue to Instructions →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Instructions */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-8 animation-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Instructions</h1>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Paste pattern rows (one per line)
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={"Row 1: Ch 20, turn\nRow 2: Sc across\n..."}
                  rows={8}
                  className="w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] font-mono text-sm"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 rounded-md bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={parsedRows.length === 0}
                  className="w-2/3 rounded-md bg-[#2D2D2D] py-3 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:opacity-50 transition-colors"
                >
                  Continue to Media →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Links & Publish */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-8 animation-fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Final Touches</h1>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Yarn Affiliate Link (Optional)
                </label>
                <input
                  type="url"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="https://amazon.com/..."
                  className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  YouTube Tutorial Link (Optional)
                </label>
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 rounded-md bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isPublishing}
                  className="w-2/3 rounded-md bg-[#D97757] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C26243] disabled:opacity-50 transition-colors"
                >
                  {isPublishing ? 'Updating Pattern...' : 'Save & Update Pattern'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}