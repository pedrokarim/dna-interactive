import { Loader2 } from "lucide-react";

interface LoadingProps {
  /**
   * Mode d'affichage du loader
   * - 'simple': juste l'icône de chargement
   * - 'withMessage': icône + message personnalisable
   * - 'box': prend toute la hauteur du conteneur parent
   * - 'fullscreen': prend tout l'écran
   */
  mode?: "simple" | "withMessage" | "box" | "fullscreen";
  /**
   * Message à afficher (uniquement pour mode 'withMessage')
   */
  message?: string;
  /**
   * Taille de l'icône (en pixels)
   */
  size?: number;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

export default function Loading({
  mode = "simple",
  message = "Chargement...",
  size = 24,
  className = "",
}: LoadingProps) {
  const spinner = (
    <Loader2
      className={`animate-spin ${className}`}
      size={size}
      strokeWidth={2}
    />
  );

  // Mode simple : juste l'icône
  if (mode === "simple") {
    return spinner;
  }

  // Mode avec message
  if (mode === "withMessage") {
    return (
      <div className="flex items-center space-x-3">
        {spinner}
        <span className="text-gray-600 dark:text-gray-300">{message}</span>
      </div>
    );
  }

  // Mode box : prend toute la hauteur du conteneur
  if (mode === "box") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        {spinner}
        {message && (
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Mode fullscreen : prend tout l'écran
  if (mode === "fullscreen") {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
          {spinner}
          {message && (
            <p className="text-gray-900 dark:text-white text-center font-medium">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Composants spécialisés pour faciliter l'usage
export function LoadingSpinner({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <Loading mode="simple" size={size} className={className} />;
}

export function LoadingWithMessage({
  message,
  size = 24,
}: {
  message: string;
  size?: number;
}) {
  return <Loading mode="withMessage" message={message} size={size} />;
}

export function LoadingBox({
  message,
  size = 32,
}: {
  message?: string;
  size?: number;
}) {
  return <Loading mode="box" message={message} size={size} />;
}

export function LoadingFullscreen({
  message,
  size = 32,
}: {
  message?: string;
  size?: number;
}) {
  return <Loading mode="fullscreen" message={message} size={size} />;
}
