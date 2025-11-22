export default function OrderSuccessPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Success Icon */}
      <div className="mb-6 rounded-full bg-green-100 p-6 animate-bounce">
        <svg 
          className="w-16 h-16 text-green-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Pesanan Berhasil! 🎉
      </h2>
      
      <p className="text-center text-gray-600 mb-8 max-w-md">
        Pesanan kamu telah kami terima. 
        Jangan lupa tunjukkan receipt saat kedatangan 😊
      </p>

      {/* Divider */}
      <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8"></div>

      {/* Instagram CTA */}
      <div className="text-center">
        <p className="text-gray-700 mb-4">
          Follow my insta!
        </p>
        
        <a
          href="https://instagram.com/Fredsz_"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-purple-600 hover:via-pink-600 hover:to-red-600"
        >
          <svg 
            className="w-6 h-6" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>@Fredsz_</span>
        </a>

        <p className="mt-4 text-sm text-gray-500">
          Nikhu IT Support
        </p>
      </div>
    </div>
  );
}