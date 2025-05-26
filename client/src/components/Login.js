import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { BsLinkedin } from "react-icons/bs";
import { SiSinglestore } from "react-icons/si";
import { FaGithub } from "react-icons/fa";
import logo from "../assets/logo.png";

const translations = {
  en: {
    login: "Login",
    loginToContinue: "Login to continue",
    invalid: "Invalid username or password",
    error: "An error occurred during login",
    name: "Name",
    password: "Password",
    remember: "Remember me",
    accessQuickly: "ACCESS QUICKLY",
    already: "Already have an account?",
    have_not_account: "Don't have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    loginBtn: "Login",
    loginLoading: "Login...",
  },
  de: {
    login: "Anmelden",
    loginToContinue: "Melden Sie sich an, um fortzufahren",
    invalid: "Ungültiger Benutzername oder Passwort",
    error: "Bei der Anmeldung ist ein Fehler aufgetreten",
    name: "Name",
    password: "Passwort",
    remember: "Angemeldet bleiben",
    accessQuickly: "SCHNELLER ZUGRIFF",
    already: "Sie haben bereits ein Konto?",
    have_not_account: "Sie haben noch kein Konto?",
    signUp: "Registrieren",
    signIn: "Anmelden",
    loginBtn: "Anmelden",
    loginLoading: "Anmelden...",
  },
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState("en");
  const navigate = useNavigate();
  const { login } = useAuth();

  const t = translations[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate("/");
      } else {
        setError(t.invalid);
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => setLang((prev) => (prev === "en" ? "de" : "en"));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between mb-4">
          <div className="text-gray-800 uppercase tracking-wider text-sm font-bold border-[#21aeb7] border-b-2 m-auto">
            <img src={logo} alt="Logo" className="h-8 w-19 mr-2 inline" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t.login}</h1>
          {/* <p className="text-sm text-gray-600 mt-1">{t.loginToContinue}</p> */}
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t.name}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-10"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword
                  ? lang === "en"
                    ? "Hide password"
                    : "Passwort verbergen"
                  : lang === "en"
                  ? "Show password"
                  : "Passwort anzeigen"
              }
            >
              {showPassword ? (
                <MdVisibilityOff className="h-5 w-5" />
              ) : (
                <MdVisibility className="h-5 w-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? t.loginLoading : t.loginBtn}
          </button>

          {/* <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
              {t.remember}
            </label>
          </div>*/}
        </form>

        <div className="mt-6">
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                {t.accessQuickly}
              </span>
            </div>
          </div> */}

          {/* <div className="mt-4 grid grid-cols-3 gap-3">
            <button
              type="button"
              className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FcGoogle className="h-5 w-5" />
              <span className="sr-only">Sign in with Google</span>
            </button>
            <button
              type="button"
              className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <BsLinkedin className="h-4 w-4 text-blue-600" />
              <span className="sr-only">Sign in with LinkedIn</span>
            </button>
            <button
              type="button"
              className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaGithub className="h-4 w-4 text-gray-500" />
              <span className="sr-only">Sign in with SSO</span>
            </button>
          </div> */}
        </div>

        {/* <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              lang === "en"
                ? "bg-[#21aeb7] text-white"
                : "bg-white text-[#2f486e] hover:bg-gray-50"
            } transition`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("de")}
            className={`flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              lang === "de"
                ? "bg-[#2f486e] text-white"
                : "bg-white text-[#21aeb7] hover:bg-gray-50"
            } transition`}
          >
            Deutsch
          </button>
        </div> */}

        <div className="mt-6 text-center text-sm">
          {/* <span className="text-gray-600">{t.have_not_account}</span>{" "}
          <a href="#" className="text-blue-600 hover:text-blue-500">
            {t.signUp}
          </a> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
