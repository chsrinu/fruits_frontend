import instance from "@/app/api/axiosInstance";

export const fetchProducts = () =>
    instance.get('/user/allProducts');
