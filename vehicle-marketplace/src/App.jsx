import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MarketHome from "./pages/MarketHome.jsx";
import Search from "./pages/Search.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx"; // <-- exact casing
import Dealerdashboard from "./pages/Dealerdashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { AuthProvider, useAuth } from "./lib/auth.jsx";

class AppErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ console.error("App error:", error, info); }
  render(){
    if(this.state.hasError){
      return (
        <section style={{maxWidth:800,margin:"24px auto"}}>
          <h2>Something went wrong</h2>
          <pre style={{whiteSpace:"pre-wrap",background:"#fafafa",border:"1px solid #eee",padding:12}}>
            {String(this.state.error?.message || this.state.error || "Unknown error")}
          </pre>
        </section>
      );
    }
    return this.props.children;
  }
}

function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 12px", borderBottom:"1px solid #eee" }}>
      <div style={{ display:"flex", gap:12 }}>
        <Link to="/">Vehicle Home</Link>
        <Link to="/search">Search</Link>
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        {user?.role === "dealer" && <Link to="/dealer">Dealer</Link>}
        {user ? (
          <>
            <span style={{ opacity:.7 }}>{user.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppErrorBoundary>
          <Nav />
          <Routes>
            <Route path="/" element={<MarketHome />} />
            <Route path="/search" element={<Search />} />
            <Route path="/v/:vin" element={<VehicleDetails />} />
            <Route path="/dealer" element={<Dealerdashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </AppErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
