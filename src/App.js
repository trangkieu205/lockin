import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Pages/Home";
import About from "./Pages/About";
export default function Test() {
  return (<>
  <h1>hello</h1></>)
}
export default function App() {
  return (
  <Router>
    <div className="p-4">
      <nav className="mb-4 space-x-4">
        <Link to="/" className="text-blue-500 hover:underline">Trang chủ</Link>
        <Link to="about" className="text-green-500 hover:underline">Giới thiệu</Link>      
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  </Router>,
  <Test />
  );
}
