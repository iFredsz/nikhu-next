'use client';

import { useEffect, useState } from "react";
import { db } from "@/app/firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc } from "firebase/firestore";
import { Loader2, Edit2, Check, Trash2, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

type Testimonial = {
  id: string;
  message: string;
  name: string;
  role: string;
  photo: string;
  rating: number | null;
};

type PortfolioItem = {
  id: string;
  url: string;
  title?: string;
};

export default function EditLayoutPage() {
  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState<PortfolioItem>({ id: "", url: "", title: "" });
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [editingPortfolio, setEditingPortfolio] = useState<Record<string, boolean>>({});
  const [savingPortfolio, setSavingPortfolio] = useState<Record<string, boolean>>({});
  const [deletingPortfolio, setDeletingPortfolio] = useState<Record<string, boolean>>({});

  // Testimonial state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonials, setEditingTestimonials] = useState<Record<string, boolean>>({});
  const [savingTestimonials, setSavingTestimonials] = useState<Record<string, boolean>>({});
  const [deletingTestimonials, setDeletingTestimonials] = useState<Record<string, boolean>>({});
  const [newTestimonial, setNewTestimonial] = useState<Testimonial>({
    id: "",
    message: "",
    name: "",
    role: "",
    photo: "",
    rating: null,
  });

  // Fetch portfolio
  const fetchPortfolio = async () => {
    setLoadingPortfolio(true);
    try {
      const snapshot = await getDocs(collection(db, "portfolio"));
      setPortfolio(
        snapshot.docs.map(doc => ({
          id: doc.id,
          url: doc.data().url || "",
          title: doc.data().title || "",
        }))
      );
      setEditingPortfolio({});
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast.error("Failed to fetch portfolio!");
    }
    setLoadingPortfolio(false);
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Fetch testimonials
  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const testimonialsSnapshot = await getDocs(collection(db, "testimonials"));
      setTestimonials(
        testimonialsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message || "",
            name: data.name || "",
            role: data.role || "",
            photo: data.photo || "",
            rating: data.rating || 5,
          };
        })
      );
      setEditingTestimonials({});
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to fetch testimonials!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Portfolio handlers
  const addPortfolioItem = async () => {
    if (!newPortfolioItem.url) {
      toast.error("Please enter a photo URL");
      return;
    }
    
    const promise = addDoc(collection(db, "portfolio"), newPortfolioItem);
    
    toast.promise(promise, {
      loading: 'Adding portfolio item...',
      success: (docRef) => {
        setPortfolio([...portfolio, { ...newPortfolioItem, id: docRef.id }]);
        setNewPortfolioItem({ id: "", url: "", title: "" });
        return "Portfolio item added successfully!";
      },
      error: "Failed to add portfolio item!",
    });
  };

  const savePortfolioItem = async (id: string) => {
    setSavingPortfolio(prev => ({ ...prev, [id]: true }));
    
    try {
      const item = portfolio.find(p => p.id === id);
      if (!item) throw new Error("Portfolio item not found");
      
      const promise = updateDoc(doc(db, "portfolio", id), {
        url: item.url,
        title: item.title,
      });
      
      toast.promise(promise, {
        loading: 'Saving portfolio item...',
        success: () => {
          setEditingPortfolio(prev => ({ ...prev, [id]: false }));
          return "Portfolio item saved successfully!";
        },
        error: "Failed to save portfolio item!",
      });
    } catch (error) {
      console.error("Error saving portfolio:", error);
      toast.error("Failed to save portfolio item!");
    }
    
    setSavingPortfolio(prev => ({ ...prev, [id]: false }));
  };

  const deletePortfolioItem = async (id: string) => {
    const item = portfolio.find(p => p.id === id);
    const itemTitle = item?.title || "Untitled";
    
    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <p className="text-gray-800 font-medium mb-3">
          Are you sure you want to delete &quot;{itemTitle}&quot;?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              setDeletingPortfolio(prev => ({ ...prev, [id]: true }));
              
              try {
                const promise = deleteDoc(doc(db, "portfolio", id));
                
                toast.promise(promise, {
                  loading: 'Deleting portfolio item...',
                  success: () => {
                    setPortfolio(prev => prev.filter(p => p.id !== id));
                    return "Portfolio item deleted successfully!";
                  },
                  error: "Failed to delete portfolio item!",
                });
              } catch (error) {
                console.error("Error deleting portfolio:", error);
                toast.error("Failed to delete portfolio item!");
              }
              
              setDeletingPortfolio(prev => ({ ...prev, [id]: false }));
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  // Testimonial handlers
  const handleTestimonialChange = (id: string, field: keyof Testimonial, value: string | number | null) => {
    setTestimonials((prev) =>
      prev.map((testi) => (testi.id === id ? { ...testi, [field]: value } : testi))
    );
  };

  const saveTestimonial = async (id: string) => {
    setSavingTestimonials((prev) => ({ ...prev, [id]: true }));
    
    try {
      const testi = testimonials.find((t) => t.id === id);
      if (!testi) throw new Error("Testimonial not found");

      const testiRef = doc(db, "testimonials", id);
      const promise = updateDoc(testiRef, {
        message: testi.message,
        name: testi.name,
        role: testi.role,
        photo: testi.photo,
        rating: testi.rating,
      });

      toast.promise(promise, {
        loading: 'Saving testimonial...',
        success: () => {
          setEditingTestimonials((prev) => ({ ...prev, [id]: false }));
          return "Testimonial saved successfully!";
        },
        error: "Failed to save testimonial!",
      });
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error("Failed to save testimonial!");
    }
    
    setSavingTestimonials((prev) => ({ ...prev, [id]: false }));
  };

  const deleteTestimonial = async (id: string) => {
    const testi = testimonials.find(t => t.id === id);
    const testiName = testi?.name || "Unknown";
    
    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <p className="text-gray-800 font-medium mb-3">
          Are you sure you want to delete testimonial from &quot;{testiName}&quot;?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              setDeletingTestimonials((prev) => ({ ...prev, [id]: true }));
              
              try {
                const promise = deleteDoc(doc(db, "testimonials", id));
                
                toast.promise(promise, {
                  loading: 'Deleting testimonial...',
                  success: () => {
                    setTestimonials((prev) => prev.filter((testi) => testi.id !== id));
                    return "Testimonial deleted successfully!";
                  },
                  error: "Failed to delete testimonial!",
                });
              } catch (error) {
                console.error("Error deleting testimonial:", error);
                toast.error("Failed to delete testimonial!");
              }
              
              setDeletingTestimonials((prev) => ({ ...prev, [id]: false }));
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  const addTestimonial = async () => {
    const { message, name, role, photo, rating } = newTestimonial;
    if (!message || !name || !role || !rating) {
      toast.error("Please fill all required fields except photo (optional)");
      return;
    }

    const promise = addDoc(collection(db, "testimonials"), {
      message,
      name,
      role,
      photo: photo || "",
      rating: Number(rating),
    });

    toast.promise(promise, {
      loading: 'Adding testimonial...',
      success: (docRef) => {
        setTestimonials([...testimonials, { ...newTestimonial, id: docRef.id }]);
        setNewTestimonial({ 
          id: "", 
          message: "", 
          name: "", 
          role: "", 
          photo: "", 
          rating: null 
        });
        return "Testimonial added successfully!";
      },
      error: "Failed to add testimonial!",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">Manage Home</h2>

      {/* Portfolio Management */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Portfolio</h2>

        {/* Add new */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Photo URL*
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 placeholder-gray-400"
              value={newPortfolioItem.url}
              onChange={(e) =>
                setNewPortfolioItem({ ...newPortfolioItem, url: e.target.value })
              }
              placeholder="Photo URL"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Title
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 placeholder-gray-400"
              value={newPortfolioItem.title}
              onChange={(e) =>
                setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })
              }
              placeholder="Title"
              required
            />
          </div>

          <button
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 col-span-1 md:col-span-2 font-medium"
            onClick={addPortfolioItem}
          >
            Add Portfolio Item
          </button>
        </div>

        {/* Portfolio List */}
        {loadingPortfolio ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : portfolio.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No portfolio items to display.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolio.map((p) => {
              const isEditing = editingPortfolio[p.id] || false;
              return (
                <div key={p.id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    value={p.url}
                    onChange={(e) =>
                      setPortfolio((prev) =>
                        prev.map(item => (item.id === p.id ? { ...item, url: e.target.value } : item))
                      )
                    }
                    disabled={!isEditing}
                    placeholder="Photo URL"
                  />
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    value={p.title || ""}
                    onChange={(e) =>
                      setPortfolio((prev) =>
                        prev.map(item => (item.id === p.id ? { ...item, title: e.target.value } : item))
                      )
                    }
                    disabled={!isEditing}
                    placeholder="Title (Optional)"
                  />
                  {p.url && (
                    <div className="w-full h-32 relative mb-2 rounded overflow-hidden border border-gray-200">
                      <Image
                        src={p.url}
                        alt={p.title || "Portfolio"}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {!isEditing ? (
                      <button
                        className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center font-medium"
                        onClick={() => setEditingPortfolio((prev) => ({ ...prev, [p.id]: true }))}
                      >
                        <Edit2 className="mr-1" size={16} /> Edit
                      </button>
                    ) : (
                      <button
                        className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-60 font-medium"
                        onClick={() => savePortfolioItem(p.id)}
                        disabled={savingPortfolio[p.id]}
                      >
                        {savingPortfolio[p.id] ? (
                          <Loader2 className="animate-spin mr-1" size={16} />
                        ) : (
                          <>
                            <Check className="mr-1" size={16} /> Save
                          </>
                        )}
                      </button>
                    )}
                    <button
                      className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center disabled:opacity-60 font-medium"
                      onClick={() => deletePortfolioItem(p.id)}
                      disabled={deletingPortfolio[p.id]}
                    >
                      {deletingPortfolio[p.id] ? (
                        <Loader2 className="animate-spin mr-1" size={16} />
                      ) : (
                        <Trash2 className="mr-1" size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Testimonial Editor Section */}
      <div className="p-6 bg-white rounded-lg shadow-md mt-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Testimonials Management</h2>

        {/* Add Testimonial Form */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message*</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition placeholder-gray-400"
              value={newTestimonial.message}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, message: e.target.value })}
              placeholder="Testimonial message"
              required
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition placeholder-gray-400"
              value={newTestimonial.name}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
              placeholder="Person&apos;s name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role/Company*</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition placeholder-gray-400"
              value={newTestimonial.role}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
              placeholder="Position or company"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition placeholder-gray-400"
              value={newTestimonial.photo}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, photo: e.target.value })}
              placeholder="Optional photo URL"
            />
            {newTestimonial.photo && (
              <div className="mt-2 h-12 w-12 relative rounded-full overflow-hidden border border-gray-200">
                <Image
                  src={newTestimonial.photo}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating* (1–5)</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={newTestimonial.rating || ""}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  rating: e.target.value ? Number(e.target.value) : null,
                })
              }
              required
            >
              <option value="">Select rating</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>
          </div>

          <button
            className="bg-green-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition col-span-1 md:col-span-2"
            onClick={addTestimonial}
          >
            Add Testimonial
          </button>
        </div>

        {/* Testimonials List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No testimonials to display.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testi) => {
              const isEditing = editingTestimonials[testi.id] || false;
              return (
                <div key={testi.id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex items-start mb-3">
                    <div className="mr-3">
                      {testi.photo ? (
                        <div className="w-12 h-12 relative rounded-full overflow-hidden border border-gray-200">
                          <Image
                            src={testi.photo}
                            alt={testi.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <User className="text-gray-500" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        value={testi.name}
                        onChange={(e) => handleTestimonialChange(testi.id, "name", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Name"
                      />
                      <input
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        value={testi.role}
                        onChange={(e) => handleTestimonialChange(testi.id, "role", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Role/Company"
                      />
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      value={testi.message}
                      onChange={(e) => handleTestimonialChange(testi.id, "message", e.target.value)}
                      rows={3}
                      placeholder="Testimonial message"
                    />
                  ) : (
                    <p className="mb-2 whitespace-pre-line text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">{testi.message}</p>
                  )}
                  
                  <div className="flex items-center mb-2">
                    <span className="mr-2 text-sm text-gray-700">Rating:</span>
                    {isEditing ? (
                      <select
                        className="border border-gray-300 rounded-md px-3 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={testi.rating || ""}
                        onChange={(e) => 
                          handleTestimonialChange(
                            testi.id,
                            "rating",
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-lg">
                            {i < (testi.rating || 0) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={testi.photo}
                      onChange={(e) => handleTestimonialChange(testi.id, "photo", e.target.value)}
                      placeholder="Photo URL"
                    />
                  )}

                  <div className="flex gap-2 mt-4">
                    {!isEditing ? (
                      <button
                        className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center font-medium"
                        onClick={() => setEditingTestimonials((prev) => ({ ...prev, [testi.id]: true }))}
                      >
                        <Edit2 className="mr-1" size={16} /> Edit
                      </button>
                    ) : (
                      <button
                        className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-60 font-medium"
                        onClick={() => saveTestimonial(testi.id)}
                        disabled={savingTestimonials[testi.id]}
                      >
                        {savingTestimonials[testi.id] ? (
                          <Loader2 className="animate-spin mr-1" size={16} />
                        ) : (
                          <>
                            <Check className="mr-1" size={16} /> Save
                          </>
                        )}
                      </button>
                    )}
                    <button
                      className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center disabled:opacity-60 font-medium"
                      onClick={() => deleteTestimonial(testi.id)}
                      disabled={deletingTestimonials[testi.id]}
                    >
                      {deletingTestimonials[testi.id] ? (
                        <Loader2 className="animate-spin mr-1" size={16} />
                      ) : (
                        <Trash2 className="mr-1" size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}