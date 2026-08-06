import axios from "axios";

//USING LOCAL STORAGE TO STORE TOKEN
// const apiClient = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
// // Interceptor: Automatically attach your token if it exists
// apiClient.interceptors.request.use((config) => {
//   // If you store your token in localStorage (common for POS apps)
//   const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
//   if (token && config.headers) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

//USING


const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, //VERY IMPORTANT
});

export default apiClient;
