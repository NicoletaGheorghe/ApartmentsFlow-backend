"use client";
import { useState, useEffect } from "react";
import { ApiClient } from "../../../../apiClient/apiClient";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Input";
import Button from "@/app/components/Button";


const edit = () => {
    const { user, setUser } = useAuth();
   const [editedUser, setEditedUser] = useState({
    name: "",
    email: "",
    password: "",
   });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const apiClient = new ApiClient();
     
    useEffect(() => {
        if (user) {
            setEditedUser({
                name: user.name || "",
                email: user.email || "",
                password: "",
            });
        }
    }, [user]);

    const handleChange = (e) => {
       setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try{
            const fieldsToUpdate = {};
            if(editedUser.name) fieldsToUpdate.name = editedUser.name;
            if(editedUser.email) fieldsToUpdate.email = editedUser.email;
            if (editedUser.password) fieldsToUpdate.password = editedUser.password;

            if(Object.keys(fieldsToUpdate).length === 0) {
                throw new Error("Please update at least one field.");
            }

            const response = await  apiClient.updateProfile(fieldsToUpdate);
            setUser(response);
            setSuccess("Profile updated successfully!");
        } catch (error) {
            setError(error.message || "Failed to update user profile.",error);
        }finally {
            setLoading(false);
        }
    }

 

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center text-[var(--color-primary)]">
        Edit your profile
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            type="text"
            name="name"
            value={editedUser.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            name="email"
            value={editedUser.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            type="password"
            name="password"
            value={editedUser.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        {success && (
           <p style={{ color: "green", marginTop: "1rem" }}>{success}</p>
        )}
        {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-[var(--color-secondary)] text-white py-2 px-4 rounded hover:bg-[var(--color-accent)]"
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>
      
      
    </div>
  )
}

export default edit