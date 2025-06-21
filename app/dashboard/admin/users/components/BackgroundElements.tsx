export default function BackgroundElements() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-indigo-400/5 to-purple-400/5 rounded-full blur-2xl"></div>
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-bl from-green-400/5 to-teal-400/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-gradient-to-tr from-orange-400/5 to-yellow-400/5 rounded-full blur-xl"></div>
    </div>
  );
} 