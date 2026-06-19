import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginData = new FormData();
loginData.append("email", formData.email);
loginData.append("password", formData.password);

const response = await API.post("/login", loginData);

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
      }

      setMessage("Login successful!");
    } catch {
      setMessage("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f2ef] flex flex-col items-center">
      {/* Logo */}
      <div className="w-full max-w-6xl py-8 px-4">
        <h1 className="text-4xl font-bold text-[#0a66c2]">
          Link<span className="bg-[#0a66c2] text-white px-2 rounded">Loop</span>
        </h1>
      </div>

      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-semibold mb-2">Sign in</h2>

        <p className="text-gray-600 mb-6">
          Stay updated on your professional world.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 mb-4"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded-md px-4 py-3 mb-6"
            required
          />

          <button
            type="submit"
            className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white py-3 rounded-full font-semibold"
          >
            Sign in
          </button>
        </form>

        {message && (
          <p className="text-center text-red-500 mt-4">
            {message}
          </p>
        )}

        <div className="text-center mt-6">
          New to LinkLoop?{" "}
          <Link
            to="/register"
            className="text-[#0a66c2] font-semibold"
          >
            Join now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;