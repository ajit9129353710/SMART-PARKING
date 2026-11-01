import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import Parking from "./Parking";

function App() {
return (
<BrowserRouter>
<Routes>
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="/parking" element={<Parking />} />

    <Route
      path="/booking/:id"
      element={<Navigate to="/login" replace />}
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>

);
}

export default App;