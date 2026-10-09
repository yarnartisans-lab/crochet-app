'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function PublishWizard() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Pattern Data States
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [hookSize, setHookSize] = useState('');
  const [yarnWeight, setYarnWeight] = useState('');

  // Category and Language States
  const [category, setCategory] = useState('Garments');
  const [language, setLanguage] = useState('English');

  // Materials and Abbreviations States
  const [materials, setMaterials] = useState('');
  const [abbreviations, setAbbreviations] = useState('');

  // State for up to 4 images
  const [images, setImages] = useState<{ file: Blob; preview: string }[]>([]);

  const [affiliateLink, setAffiliateLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [instructions, setInstructions] = useState([{ step_number: 1, instruction: '' }]);

  // Authentication Check
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router, supabase]);

  const addInstructionRow = () => {
    setInstructions([
      ...instructions,
      { step_number: instructions.length + 1, instruction: '' },
    ]);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index].instruction = value;
    setInstructions(newInstructions);
  };

  const removeInstructionRow = (index: number) => {
    if (instructions.length > 1) {
      const newInstructions = instructions.filter((_, i) => i !== index);
      // Re-number the steps
      const renumbered = newInstructions.map((inst, i) => ({ ...inst, step_number: i + 1 }));
      setInstructions(renumbered);
    }
  };

  // Handle Multiple Images
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) {
      alert('You can only upload up to 4 images.');
      return;
    }

    setIsCompressing(true);
    const newImages: { file: Blob; preview: string }[] = [];

    for (const file of files) {
      const compressedImage = await new Promise<{ file: Blob; preview: string }>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new window.Image();
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

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({ file: blob, preview: URL.createObjectURL(blob) });
                }
              },
              'image/webp',
              0.8
            );
          };
        };
      });
      newImages.push(compressedImage);
    }

    setImages((prev) => [...prev, ...newImages]);
    setIsCompressing(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Please log in to publish.');
      setLoading(false);
      return;
    }

    // 1. Generate SEO-friendly base slug with fallback protection
    const baseSlug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replaces spaces and special chars with hyphens
        .replace(/(^-|-$)+/g, '') || 'crochet-pattern'; // Fallback ensures slug is never empty

    // 2. High-Performance Slug Checker (Single Query)
    let finalSlug = baseSlug;

    const { data: existingPattern } = await supabase
      .from('patterns')
      .select('slug')
      .eq('slug', baseSlug)
      .maybeSingle();

    if (existingPattern) {
      // If the base slug is taken, append a random 5-character hash to guarantee uniqueness
      const randomHash = Math.random().toString(36).substring(2, 7);
      finalSlug = `${baseSlug}-${randomHash}`;
    }

    let finalUrls: string[] = [];

    // 3. Upload all images with the guaranteed unique slug
    for (let i = 0; i < images.length; i++) {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const fileName = `${finalSlug}-${i + 1}-${uniqueSuffix}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('pattern_images')
        .upload(fileName, images[i].file, { contentType: 'image/webp' });

      if (!uploadError) {
        const { data } = supabase.storage.from('pattern_images').getPublicUrl(fileName);
        finalUrls.push(data.publicUrl);
      }
    }

    // 4. Insert Pattern
    const mainImageUrl = finalUrls.length > 0 ? finalUrls[0] : null;

    const { data: patternData, error: patternError } = await supabase
      .from('patterns')
      .insert({
        designer_id: user.id,
        title,
        slug: finalSlug, // USING THE VERIFIED UNIQUE SLUG HERE
        difficulty_level: difficulty,
        hook_size: hookSize,
        yarn_weight: yarnWeight,
        category,
        language,
        materials,
        abbreviations,
        image_url: mainImageUrl,
        image_urls: finalUrls,
        affiliate_link: affiliateLink || null,
        video_link: videoLink || null,
        is_published: true,
      })
      .select()
      .single();

    if (patternError || !patternData) {
      console.error(patternError);
      alert('Failed to publish pattern.');
      setLoading(false);
      return;
    }

    // 5. Insert Steps
    const stepsToInsert = instructions
      .filter((step) => step.instruction.trim() !== '')
      .map((step) => ({
        pattern_id: patternData.id,
        step_number: step.step_number,
        instruction: step.instruction,
      }));

    if (stepsToInsert.length > 0) {
      await supabase.from('pattern_steps').insert(stepsToInsert);
    }

    // Redirect to the newly generated unique slug
    router.push(`/pattern/${patternData.slug}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]"
          >
            Cancel
          </Link>
          <span className="font-bold tracking-tight">Create Pattern</span>
          <div className="text-sm font-semibold text-gray-400">Step {step} of 3</div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-12">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight mb-1">The Basics</h2>
                <p className="text-sm text-gray-500">Let&apos;s start with the core details.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pattern Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chunky Ribbed Beanie"
                  className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hook Size</label>
                  <input
                    type="text"
                    value={hookSize}
                    onChange={(e) => setHookSize(e.target.value)}
                    placeholder="e.g. 5.0mm (H)"
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Yarn Weight</label>
                <input
                  type="text"
                  value={yarnWeight}
                  onChange={(e) => setYarnWeight(e.target.value)}
                  placeholder="e.g. Worsted / Weight 4"
                  className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pattern Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                  >
                    <option value="Garments">Garments (Sweaters, Tops)</option>
                    <option value="Accessories">Accessories (Hats, Bags)</option>
                    <option value="Amigurumi / Plushies">Amigurumi / Plushies</option>
                    <option value="Home Decor">Home Decor</option>
                    <option value="Blankets">Blankets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757]"
                  >
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
                Continue to Media →
              </button>
            </div>
          )}

          {/* STEP 2: MEDIA & LINKS */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight mb-1">Media & Monetization</h2>
                <p className="text-sm text-gray-500">Add up to 4 photos and your optional links.</p>
              </div>

              {/* Multiple Image Uploader */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">Photos ({images.length}/4)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group"
                    >
                      <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {images.length < 4 && (
                    <label className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#D97757] hover:bg-[#D97757]/5 transition-colors bg-gray-50">
                      <span className="text-xs font-semibold text-gray-500 text-center px-2">
                        {isCompressing ? 'Processing...' : '+ Add Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={isCompressing}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Yarn Link{' '}
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                      Revenue
                    </span>
                  </label>
                  <input
                    type="url"
                    value={affiliateLink}
                    onChange={(e) => setAffiliateLink(e.target.value)}
                    placeholder="https://amazon.com/your-yarn-link"
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If they buy yarn through this link, you earn a commission.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">YouTube Tutorial Link</label>
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 rounded-md bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 rounded-md bg-[#2D2D2D] py-3 text-sm font-semibold text-white shadow-sm hover:bg-black transition-colors"
                >
                  Write Instructions →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INSTRUCTIONS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight mb-1">Instructions</h2>
                <p className="text-sm text-gray-500">Break it down row by row.</p>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {instructions.map((stepData, index) => (
                  <div key={index} className="flex gap-3 relative group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-500">
                      {stepData.step_number}
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={stepData.instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        placeholder={`Row ${stepData.step_number} instructions...`}
                        rows={2}
                        className="w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#D97757] resize-none"
                      />
                      {instructions.length > 1 && (
                        <button
                          onClick={() => removeInstructionRow(index)}
                          className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addInstructionRow}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-semibold hover:border-[#D97757] hover:text-[#D97757] transition-colors"
              >
                + Add Another Row
              </button>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 rounded-md bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-2/3 rounded-md bg-[#D97757] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#C26243] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Publishing...' : 'Publish to Crpapo ✨'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}