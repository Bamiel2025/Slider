
import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import { generateComparisonHtml, Transform } from './services/htmlGenerator';
import { ExportIcon, GenerateIcon, AnalyzeIcon } from './components/Icons';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');

  const getBase64 = (dataUrl: string) => dataUrl.substring(dataUrl.indexOf(',') + 1);
  const getMimeType = (dataUrl: string) => dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));

  const handleGenerate = useCallback(async () => {
    if (!image1 || !image2) return;

    setIsLoading(true);
    setGeneratedHtml(null);
    let transform1: Transform = { scale: 1, translateX: 0, translateY: 0, rotation: 0 };
    let transform2: Transform | null = null;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const image1Part = { inlineData: { mimeType: getMimeType(image1), data: getBase64(image1) } };
      const image2Part = { inlineData: { mimeType: getMimeType(image2), data: getBase64(image2) } };

      setLoadingText("Analyse pour l'alignement...");
      
      const transformSchema = {
        type: Type.OBJECT,
        properties: {
          scale: { type: Type.NUMBER, description: 'Scaling factor. 1.0 is original size. Example: 1.2 means 20% larger.' },
          translateX: { type: Type.NUMBER, description: 'Horizontal translation as a percentage of the image\'s own container width.' },
          translateY: { type: Type.NUMBER, description: 'Vertical translation as a percentage of the image\'s own container height.' },
          rotation: { type: Type.NUMBER, description: 'Rotation in degrees. Example: 5 means rotate 5 degrees clockwise.' },
        },
        required: ['scale', 'translateX', 'translateY', 'rotation'],
      };

      const alignPrompt = `You are an expert computer vision system specializing in affine image registration.
Your goal is to find the precise CSS transform properties for Image 2 to make its main subject perfectly overlay the main subject in Image 1.

**Context:**
1. Image 1 is the reference image. It will not be transformed.
2. Image 2 is the image to be transformed.
3. Both images will be displayed inside a container where they are scaled down to fit while preserving their aspect ratio. Your calculated transform will be applied to this scaled-down version of Image 2.
4. The CSS \`transform-origin\` for Image 2 is \`top left\`.

**Instructions:**
1.  **Identify Key Feature Points:** Mentally identify at least 5 matching feature points (landmarks) on the main subject of both images (e.g., corners of an object, specific marks).
2.  **Calculate Transformation:** Based on these corresponding points, calculate the optimal 2D affine transformation (scale, translation, rotation) that minimizes the distance between the points in Image 2 and their counterparts in Image 1.
3.  **Output Format:** Provide the result as a single JSON object with the keys \`scale\`, \`translateX\`, \`translateY\`, and \`rotation\`.
    - \`scale\`: The scaling factor. E.g., \`1.1\` for 110%.
    - \`translateX\`: The horizontal shift as a percentage of the image's rendered width.
    - \`translateY\`: The vertical shift as a percentage of the image's rendered height.
    - \`rotation\`: The rotation in clockwise degrees.

Respond ONLY with the JSON object.`;
      
      const alignResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [ {text: alignPrompt}, image1Part, image2Part ]},
        config: {
          responseMimeType: "application/json",
          responseSchema: transformSchema,
        },
      });
      transform2 = JSON.parse(alignResponse.text);

    } catch (error) {
      console.error("AI analysis failed:", error);
      // Fallback to non-aligned generation if any AI step fails
      transform2 = null; 
    } finally {
      setLoadingText("Génération de l'aperçu...");
      const html = generateComparisonHtml(image1, image2, transform1, transform2);
      setGeneratedHtml(html);
      setIsLoading(false);
      setLoadingText('');
    }
  }, [image1, image2]);

  const handleExport = useCallback(() => {
    if (generatedHtml) {
      const blob = new Blob([generatedHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'comparaison-images.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [generatedHtml]);

  const isGenerating = loadingText.includes('Génération');

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <div className="container mx-auto p-4 sm:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Comparateur d'Images Interactif</h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Importez deux images pour générer un fichier HTML autonome avec un curseur de comparaison aligné par IA et des outils de mesure.</p>
        </header>

        <main>
          <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <ImageUploader onImageUpload={setImage1} label="Image 1" />
              <ImageUploader onImageUpload={setImage2} label="Image 2" />
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={handleGenerate}
                disabled={!image1 || !image2 || isLoading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {!isGenerating && <AnalyzeIcon />}
                  </>
                ) : (
                  <GenerateIcon />
                )}
                <span>{isLoading ? loadingText : 'Générer & Prévisualiser'}</span>
              </button>

              {generatedHtml && (
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-400 transition-all duration-300 transform hover:scale-105"
                >
                  <ExportIcon />
                  <span>Exporter le fichier HTML</span>
                </button>
              )}
            </div>
          </div>
          
          {generatedHtml && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-center mb-4">Aperçu en direct</h2>
              <div className="w-full aspect-video bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <iframe
                  srcDoc={generatedHtml}
                  title="Aperçu interactif"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </main>

        <footer className="text-center mt-12 text-slate-500">
          <p>Créé avec React, Tailwind CSS et l'expertise de Gemini.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
