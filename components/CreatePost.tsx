import React, { useState, useRef, useEffect } from 'react';
import type { User, SocialPost } from '../types';

interface CreatePostProps {
  currentUser: User;
  onAddPost: (post: Omit<SocialPost, 'id' | 'timestamp' | 'author_id' | 'likedBy' | 'comments'>) => void;
  sharedImage?: string | null;
  clearSharedImage?: () => void;
  sharedPostData?: { text: string; category: 'Vitória' | 'Estratégia' | 'Dúvida' | 'Sugestão' } | null;
  canReturnFromShare?: boolean;
  onReturnFromShare?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onAddPost, sharedImage, clearSharedImage, sharedPostData, canReturnFromShare, onReturnFromShare }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<'Vitória' | 'Estratégia' | 'Dúvida' | 'Sugestão'>('Estratégia');
  const [image, setImage] = useState<{ file?: File, previewUrl: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sharedImage) {
        setImage({ previewUrl: sharedImage });
        setText("Confiram minha análise do mercado! O que acham dessa tendência? #Estratégia");
        setCategory('Estratégia');
        if (clearSharedImage) {
            clearSharedImage();
        }
    }
  }, [sharedImage, clearSharedImage]);

  useEffect(() => {
    if (sharedPostData) {
        setText(sharedPostData.text);
        setCategory(sharedPostData.category);
    }
  }, [sharedPostData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({
        file: file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };
  
  const removeImage = () => {
      if (image?.previewUrl && image.file) { // Only revoke if it's a blob URL
          URL.revokeObjectURL(image.previewUrl);
      }
      setImage(null);
      if(imageInputRef.current) {
          imageInputRef.current.value = '';
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onAddPost({
      text: text,
      category: category,
      imageUrl: image?.previewUrl || '', // In a real app, this would be an uploaded URL
    });
    
    // Reset form
    setText('');
    setCategory('Vitória');
    removeImage();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl p-4 shadow-xl sticky top-20 z-30 border-2 border-lime-500/50">
      <div className="flex items-start gap-4">
        <img
          src={currentUser.avatar_url}
          alt={currentUser.display_name}
          className="w-11 h-11 rounded-full flex-shrink-0 mt-1"
        />
        <div className="w-full">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-gray-800/50 text-white placeholder-gray-400 p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-lime-500"
            placeholder={`O que está acontecendo, ${currentUser.display_name}?`}
            rows={3}
          />
          {image && (
            <div className="mt-2 relative w-32">
              <img src={image.previewUrl} alt="Preview" className="rounded-lg w-full h-auto" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 leading-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="flex items-center gap-2 flex-wrap">
            <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageChange}
                className="hidden"
            />
            <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 p-2 rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
                title="Adicionar imagem"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
            </button>
             <div className="h-6 w-px bg-gray-700"></div>
            {(['Vitória', 'Estratégia', 'Dúvida', 'Sugestão'] as const).map(cat => (
                <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${category === cat ? 'bg-lime-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    {cat}
                </button>
            ))}
             {canReturnFromShare && (
                <button
                    type="button"
                    onClick={onReturnFromShare}
                    className="font-semibold py-2 px-4 rounded-lg transition-colors text-sm text-lime-300 bg-gray-800/50 hover:bg-gray-700/50"
                >
                    ← Voltar ao Resumo
                </button>
            )}
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-5 rounded-lg transition-colors disabled:opacity-50"
        >
          Publicar
        </button>
      </div>
    </form>
  );
};

export default CreatePost;