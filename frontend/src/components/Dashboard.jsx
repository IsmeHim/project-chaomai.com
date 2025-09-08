import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard({ setAuth }) {

    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token'); // Get token from localStorage

    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove token from localStorage
        setAuth(false); // Update authentication state
        navigate('/login'); // Redirect to login page
    }
    useEffect(() => {

      axios.get('http://localhost:5000/api/protected', {
        headers: {
          Authorization: `Bearer ${token}` // Send token in headers
        }
      })
      .then((response) => {
          setData(response.data);
          console.log('Protected data: ',response.data);
      })
      .catch(error => {
          console.error('Error fetching protected data:', error.response ? error.response.data : error.message);
          if (error.response && error.response.status === 401) {
              // If unauthorized, redirect to login
              navigate('/login');
          }
      });
    }, [ navigate, token ]); // สาเหตุที่เพิ่ม token ใน dep array คือถ้า token เปลี่ยน จะได้รีเฟรชข้อมูลใหม่ครั้งเดียว

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-25">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard For test</h1>
            <ul>
                <li>Your email: {data.user?.email}</li>
                <li>Your name: {data.user?.username}</li>
            </ul>
            <button onClick={handleLogout} className='px-4 py-3 bg-red-500 rounded-xl hover:bg-red-600'>Log out</button>
        </div>
    </div>
  )
}

export default Dashboard