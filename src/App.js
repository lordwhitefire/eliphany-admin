import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProductsManager from './components/ProductsManager';
import { AuthProvider} from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import NewArrivalProducts from './components/NewArrivalProducts';
import HomeSettings from './components/HomeSettings';
import AboutSettings from './components/AboutSettings';
import { NewArrivalsProvider } from './context/NewArrivalsContext';

import './index.css';



function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <NewArrivalsProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/login" element={<Login />} />
                <Route path="/admin/dashboard" element={<Dashboard />} /> 
                <Route path="/admin/products" element={<ProductsManager />} />
                <Route path="/admin/new-arrivals" element={<NewArrivalProducts />} />
                <Route path="/admin/settings/home" element={<HomeSettings />} />
                <Route path="/admin/settings/about" element={<AboutSettings />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
        </NewArrivalsProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

export default App;