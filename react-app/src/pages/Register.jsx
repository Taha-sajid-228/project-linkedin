import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setIsError(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.email.includes("@") || !formData.email.endsWith(".com")) {
      setIsError(true);
      setMessage("Email must contain @ and end with .com");
      return;
    }

    if (formData.username.length <= 5) {
      setIsError(true);
      setMessage("Username must be greater than 5 characters.");
      return;
    }

    if (formData.password.length < 8) {
      setIsError(true);
      setMessage("Password must be at least 8 characters.");
      return;
    }

   try {
  const registerData = new FormData();
  registerData.append("username", formData.username);
  registerData.append("email", formData.email);
  registerData.append("password", formData.password);

  await API.post("/register", registerData);

  setIsError(false);
  setMessage("Registration successful!");

  setFormData({
    username: "",
    email: "",
    password: "",
  });
} catch {
  setIsError(true);
  setMessage("Registration failed.");
}
 try {
      const registerData = new FormData();
registerData.append("username", formData.username);
registerData.append("email", formData.email);
registerData.append("password", formData.password);

await API.post("/register", registerData);

      setIsError(false);
      setMessage("Registration successful!");

      setFormData({
        username: "",
        email: "",
        password: "",
      });
   } catch (error) {
  console.log(error);
  setIsError(true);
  setMessage(error.response?.data?.detail || "Registration failed.");
}
  };

  return (
    <div className="min-h-screen bg-[#f3f2ef] flex flex-col items-center">
      <div className="w-full max-w-6xl py-8 px-4">
        <h1 className="text-4xl font-bold text-[#0a66c2]">
          Link<span className="bg-[#0a66c2] text-white px-2 rounded">Loop</span>
        </h1>
      </div>

      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-semibold mb-2">Join LinkLoop</h2>

        <p className="text-gray-600 mb-6">
          Build your professional network.
        </p>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            minLength={6}
            className="w-full border rounded-md px-4 py-3 mb-4"
            required
          />

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
            minLength={8}
            className="w-full border rounded-md px-4 py-3 mb-6"
            required
          />

          <button
            type="submit"
            className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white py-3 rounded-full font-semibold"
          >
            Agree & Join
          </button>
        </form>

        {message && (
          <p
            className={`text-center mt-4 ${
              isError ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        <div className="text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#0a66c2] font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;