// src/pages/Home.jsx
function Home() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white p-4">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">Lockin</h1>
        <p className="text-gray-600 text-center max-w-md">
          Cùng bạn xây dựng hành trình giảm cân bền vững: ăn uống lành mạnh, tập luyện và hồi phục đúng cách.
        </p>
        <button className="mt-6 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow">
          Bắt đầu ngay
        </button>
      </div>
    );
  }
  
  export default Home;
  