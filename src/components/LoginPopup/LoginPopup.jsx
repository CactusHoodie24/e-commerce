import React, { useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import axios from "axios";
axios.defaults.withCredentials = true;
import { BACKEND_URL } from "../../config/backend"; 

const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState("Sign Up");
  const [details, setDetails] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [warning, setWarning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // basic validation
    if (
      !details.email ||
      !details.password ||
      (currState === "Sign Up" && !details.name)
    ) {
      setWarning(true);
      return;
    } else {
      setWarning(false);
    }

    const payload = {
      name: details.name,
      email: details.email,
      password: details.password,
    };

   const sendData = async () => {
  setLoading(true);
  setError("");
  try {
    let res;

    if (currState === "Sign Up") {
      res = await axios.post(
        `${BACKEND_URL}/api/users`,
        payload
      );

      if (res.status === 201) {
        // backend sends HttpOnly cookie automatically
        setSuccess(true);

        // save user info only (NO TOKEN)
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } else if (currState === "Login") {
      res = await axios.post(
        `${BACKEND_URL}/api/users/login`,
        {
          email: details.email,
          password: details.password,
        }
      );

      if (res.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000)
      } else {
        setSuccess(false)
      }
    }

    setDetails({ name: "", email: "", password: "" });
    setTimeout(() => {
      setSuccess(false);
      setShowLogin(false);
    }, 1500);

  } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
  } finally {
    setLoading(false);
  }
};
sendData()
  };

  return (
    <div className="login-popup fade-in">
      <form onSubmit={handleSubmit} className="login-popup-container pop-in">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
            className="close-icon"
          />
        </div>

        <div className="login-popup-inputs">
          {currState === "Login" ? null : (
            <input
              type="text"
              value={details.name}
              onChange={(e) =>
                setDetails((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Your name"
              required
            />
          )}

          <input
            type="email"
            placeholder="Your email"
            value={details.email}
            onChange={(e) =>
              setDetails((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />

          <input
            type="password"
            placeholder="Your password"
            value={details.password}
            onChange={(e) =>
              setDetails((prev) => ({ ...prev, password: e.target.value }))
            }
            required
          />
        </div>

        {warning && <p className="warning shake">Please fill in all fields</p>}
        {success && (
          <p className="success fade-in">
            {currState === "Sign Up"
              ? "User created successfully 🎉"
              : "Login successful 🎉"}
          </p>
        )}
        {error && <p className="error shake">{error}</p>}
        <button disabled={loading} className={loading ? "loading-btn" : ""}>
          {loading
            ? "Processing..."
            : currState === "Sign Up"
            ? "Create account"
            : "Login"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>

        {currState === "Login" ? (
          <p>
            Create new account?{" "}
            <span onClick={() => setCurrState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
