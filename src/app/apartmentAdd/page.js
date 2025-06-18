"use client";
import { useState, useEffect, useRef } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { ApiClient } from "../../../apiClient/apiClient";
import Input from "../components/Input";
import Button from "../components/Button";

const libraries = ['places'];
export default function ApartmentAdd() {
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        latitude: "",
        longitude: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
        amenities: "",
        images: "",
        status: "",
        });
        const [errors, setErrors] = useState({});
        const [success, setSuccess] = useState(false);
        const [loading, setLoading] = useState(false);

        
        const { isLoaded } = useLoadScript({
            googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            libraries,
        });

        useEffect(() => {
            const apiClient = new ApiClient();
            if (!apiClient.isLoggedIn()) {
                window.location.href = "/auth/unauthorized";
            }
        }, []);

       

        useEffect(() => {
        if (!isLoaded) return;

        const input = document.getElementById("autocomplete");
        if (!input) return;

        const autocomplete = new window.google.maps.places.Autocomplete(input, {
            types: ["address"],
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.address_components) {
            setErrors((prev) => ({
                ...prev,
                street: "Please select a valid address from the suggestions.",
            }));
            return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const getComponent = (type) => {
            const comp = place.address_components.find((c) =>
                c.types.includes(type)
            );
            return comp ? comp.long_name : "";
            };

            setFormData((prev) => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString(),
                street: `${getComponent("street_number")} ${getComponent("route")}`.trim(),
                city: getComponent("locality") || getComponent("postal_town"),
                state: getComponent("administrative_area_level_1"),
                zipCode: getComponent("postal_code"),
                country: getComponent("country"),
                }));

            setErrors((prev) => {
            const copy = { ...prev };
            ["street", "city", "state", "zipCode", "country", "latitude", "longitude"].forEach(f => delete copy[f]);
            return copy;
            });
        });
        }, [isLoaded]);
        const validateForm = () => {
            const newErrors = {};
            if (!formData.title.trim()) newErrors.title = "Title is required.";
            if (!formData.description.trim()) newErrors.description = "Description is required.";
            if (!formData.price.trim()) newErrors.price = "Price is required.";
            //if (!formData.location.trim()) newErrors.location = "Location is required.";
            if (!formData.bedrooms.trim()) newErrors.bedrooms = "Bedrooms are required.";
            if (!formData.bathrooms.trim()) newErrors.bathrooms = "Bathrooms are required.";
            if (!formData.area.trim()) newErrors.area = "Area is required.";
            if (!formData.amenities.trim()) newErrors.amenities = "Amenities are required.";
            if (!formData.status.trim()) newErrors.status = "Status is required.";
            if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) < 0)) {
                newErrors.price = "Please enter a valid price.";
            }
            if (formData.bedrooms && (isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0)) {
                newErrors.bedrooms = "Please enter a valid number of bedrooms.";
            }
            if (formData.bathrooms && (isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0)) {
                newErrors.bathrooms = "Please enter a valid number of bathrooms.";
            }
            if (formData.area && (isNaN(Number(formData.area)) || Number(formData.area) < 0)) {
                newErrors.area = "Please enter a valid area.";
            }
             if (!formData.street.trim()) newErrors.street = "Street is required.";
            if (!formData.city.trim()) newErrors.city = "City is required.";
            if (!formData.state.trim()) newErrors.state = "State is required.";
            if (!formData.zipCode.trim()) newErrors.zipCode = "Zip Code is required.";
            if (!formData.country.trim()) newErrors.country = "Country is required.";
            if (!formData.latitude.trim()) newErrors.latitude = "Latitude is required.";
            else if (isNaN(Number(formData.latitude))) newErrors.latitude = "Latitude must be a number.";
            if (!formData.longitude.trim()) newErrors.longitude = "Longitude is required.";
            else if (isNaN(Number(formData.longitude))) newErrors.longitude = "Longitude must be a number.";
                    setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
           
          };
        const handleSubmit = async (e) => {
          e.preventDefault();
          console.log("Form submission triggered");
          setSuccess(false);
          if (validateForm()) {
            setLoading(true);
            try{
                 const apiClient = new ApiClient();
                const location = {
                        type: "Point",
                        coordinates: [Number(formData.longitude), Number(formData.latitude)],
                        address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zipCode: formData.zipCode,
                        country: formData.country,
                        },
                    };

                   await apiClient.createApartment(
                    formData.title,
                    formData.description,
                    Number(formData.price),
                    location,
                    Number(formData.bedrooms),
                    Number(formData.bathrooms),
                    Number(formData.area),
                    formData.amenities.split(",").map((a) => a.trim()),
                    formData.images ? formData.images.split(",").map((img) => img.trim()) : [], 
                    formData.status,
                 );
                 setSuccess(true);
                 setFormData({
                    title: "",
                    description: "",
                    price: "",
                    latitude: "",
                    longitude: "",
                    street: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    country: "",
                    bedrooms: "",
                    bathrooms: "",
                    area: "",
                    amenities: "",
                    images: "",
                    status: "",
                 });
            } catch (error) {
                console.error("Error listing an apartment.", error.response || error);
                setErrors({
                    submit: error.response?.data?.message || "Failed to list an apartment. Please try again.",  
                }); 
             }
             setLoading(false);
          }
        };
            const handleChange = (e) => {
                const { name, value } = e.target;
                setFormData((prev) => ({ ...prev, [name]: value }));
                if (errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: "" }));
                }
            };
 return (
    <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-8">List An Apartment</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Input
                label="Title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a title"
                required />
                {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
            </div>
            <div>
                <Input
                label="Description"
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter a description"
                required />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
            </div>
            <div>
                <Input
                label="Price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter a price"
                required />
                {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                )}
            </div>
            <div>
                <label htmlFor="autocomplete" className="block mb-1 font-semibold">
                    Search Address
                </label>
                <input
                    id="autocomplete"
                    type="text"
                    placeholder="Start typing address..."
                    className="w-full p-2 border rounded"
                />
            </div>
            {/* <div>
                <Input
                label="Latitude"
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Enter latitude"
                required />
                {errors.latitude && (
                    <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
                )}
            </div> */}
            {/* <div>
                <Input
                label="Longitude"
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Enter longitude"
                required />
                {errors.longitude && (
                    <p className="mt-1 text-sm text-red-500">{errors.longitude}</p>
                )}
            </div> */}
            <div>
                <Input
                label="Street"
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Enter street"
                required />
                {errors.street && (
                    <p className="mt-1 text-sm text-red-500">{errors.street}</p>
                )}
            </div>
            <div>
                <Input
                label="City"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                required />
                {errors.city && (
                    <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                )}
            </div>
            <div>
                <Input
                label="State"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state"
                required />
                {errors.state && (
                    <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                )}
            </div>
            <div>
                <Input
                label="Zip Code"
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="Enter zip code"
                required />
                {errors.zipCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>
                )}
            </div>
            <div>
                <Input
                label="Country"
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Enter country"
                required />
                {errors.country && (
                    <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                )}
            </div>
            
            <div>
                <Input
                label="Bedrooms"
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                placeholder="Enter number of bedrooms"
                required />
                {errors.bedrooms && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedrooms}</p>
                )}
            </div>
            <div>
                <Input
                label="Bathrooms"
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                placeholder="Enter number of bathrooms"
                required />
                {errors.bathrooms && (
                    <p className="mt-1 text-sm text-red-500">{errors.bathrooms}</p>
                )}
            </div>
            <div>
                <Input
                label="Area"
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Enter an area"
                required />
                {errors.area && (
                    <p className="mt-1 text-sm text-red-500">{errors.area}</p>
                )}
            </div>
            <div>
                <Input
                label="Amenities (comma separated)"
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                placeholder="Enter the amenities"
                required />
                {errors.amenities && (
                    <p className="mt-1 text-sm text-red-500">{errors.amenities}</p>
                )}
            </div>
            <div>
                <Input
                label="Images"
                type="text"
                name="images"
                value={formData.images}
                onChange={handleChange}
                placeholder="Add images"
                />
            </div>
            <div>
                <Input
                label="Status"
                type="text"
                name="status"
                value={formData.status}
                onChange={handleChange}
                placeholder="Enter status (available, rented, pending)"
                required />
                {errors.status && (
                    <p className="mt-1 text-sm text-red-500">{errors.status}</p>
                )}
            </div>
            {errors.submit && (
                <p className="text-red-500 text-sm">{errors.submit}</p>
                )}
             <Button type="submit">
                   {loading ? 'Listing apartment...' : 'List an apartment'}
              </Button>
        </form>
    </div>
 )           
}