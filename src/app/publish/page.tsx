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

  // Post-publish success state for Pinterest promotion
  const [publishedPattern, setPublishedPattern] = useState<{
    id: string;
    slug: string;
    title: string;
    imageUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'crochet-pattern';

    // 2. High-Performance Slug Checker
    let finalSlug = baseSlug;

    const { data: existingPattern } = await supabase
      .from('patterns')
      .select('slug')
      .eq('slug', baseSlug)
      .maybeSingle();

    if (existingPattern) {
      const randomHash = Math.random().toString(36).substring(2, 7);
      finalSlug = `${baseSlug}-${randomHash}`;
    }

    let finalUrls: string[] = [];

    // 3. Upload all images
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
        slug: finalSlug,
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

    // 6. Transition to Step 4: Celebration and Pinterest promotion prompt
    setPublishedPattern({
      id: patternData.id,
      slug: patternData.slug,
      title: patternData.title,
      imageUrl: mainImageUrl || '',
    });
    setStep(4);
    setLoading(false);
  };

  // Pinterest Share Intent
  const handlePinToPinterest = () => {
    if (!publishedPattern || typeof window === 'undefined') return;
    const pageUrl = `${window.location.origin}/pattern/${publishedPattern.slug}`;
    const imgUrl = publishedPattern.imageUrl;
    const pinDescription = `Free ${publishedPattern.title} crochet pattern with interactive row tracking on Crpapo!`;
    const pinUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
      pageUrl
    )}&media=${encodeURIComponent(imgUrl)}&description=${encodeURIComponent(pinDescription)}`;
    window.open(pinUrl, '_blank', 'noopener,noreferrer,width=750,height=600');
  };

  const handleCopyLink = () => {
    if (!publishedPattern || typeof window === 'undefined') return;
    const pageUrl = `${window.location.origin}/pattern/${publishedPattern.slug}`;
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-gray-500 hover:text-[#2D2D2D]"
          >
            {step === 4 ? 'Dashboard' : 'Cancel'}
          </Link>
          <span className="font-bold tracking-tight">
            {step === 4 ? 'Pattern Live!' : 'Create Pattern'}
          </span>
          <div className="text-sm font-semibold text-gray-400">
            {step === 4 ? (
              <span className="text-green-600 font-bold">Done ✨</span>
            ) : (
              `Step ${step} of 3`
            )}
          </div>
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
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Photos ({images.length}/4)</label>
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                    💡 Tip: 2:3 vertical photos rank 4x higher on Pinterest
                  </span>
                </div>
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

          {/* STEP 4: CELEBRATION & PINTEREST PROMOTION */}
          {step === 4 && publishedPattern && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center py-4">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full mx-auto flex items-center justify-center text-3xl shadow-sm">
                🎉
              </div>

              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">Your pattern is live!</h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">
                  &quot;{publishedPattern.title}&quot; is published on Crpapo with interactive row tracking.
                </p>
              </div>

              {/* Promotion Callout Box */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100 text-left space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📌</span>
                  <h3 className="font-bold text-gray-900 text-base">Drive Traffic from Pinterest</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Over 60% of crochet traffic comes from Pinterest. Pin your new pattern now to reach thousands of crafters and maximize your yarn affiliate earnings.
                </p>

                <button
                  onClick={handlePinToPinterest}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-sm font-bold bg-[#E60023] hover:bg-[#ad081b] text-white shadow-md transition-all hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                  </svg>
                  <span>Pin to Pinterest Now</span>
                </button>
              </div>

              {/* Secondary Sharing Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  <span>{copied ? 'Copied Link!' : 'Copy Link for Bio'}</span>
                </button>

                <Link
                  href={`/pattern/${publishedPattern.slug}`}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2D2D2D] hover:bg-black text-sm font-semibold text-white transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <span>View Live Pattern →</span>
                </Link>
              </div>

              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-semibold"
                >
                  Go to Creator Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}