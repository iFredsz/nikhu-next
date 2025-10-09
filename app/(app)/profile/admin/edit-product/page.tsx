'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Edit2, Trash2, Plus, Check, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

type Product = {
  id: string
  name: string
  price: number
  description: string
  hot: boolean
  thumbnail?: string
  gallery?: string[]
}

type Addon = {
  id: string
  name: string
  price: number
  type: 'fixed' | 'per_item'
}

type Voucher = {
  id: string
  code: string
  amount: number
  active: boolean
  description?: string
  currentUsage?: number
}

export default function EditLayoutPage() {
  // State untuk produk
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    hot: false,
    thumbnail: '',
    gallery: []
  })

  // State untuk addons
  const [addons, setAddons] = useState<Addon[]>([])
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [newAddon, setNewAddon] = useState<Partial<Addon>>({
    name: '',
    price: 0,
    type: 'fixed',
  })

  // State untuk vouchers
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [newVoucher, setNewVoucher] = useState<Partial<Voucher>>({
    code: '',
    amount: 0,
    active: true,
    description: ''
  })

  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false) // Flag untuk mencegah duplikasi

  // 🔹 Ambil semua data dari Firestore dengan realtime updates
  useEffect(() => {
    // Listener untuk products
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name || '',
        price: d.data().price || 0,
        description: d.data().description || '',
        hot: d.data().hot || false,
        thumbnail: d.data().thumbnail || '',
        gallery: Array.isArray(d.data().gallery) ? d.data().gallery : [],
      }))
      setProducts(productsData)
    })

    // Listener untuk addons
    const unsubscribeAddons = onSnapshot(collection(db, 'addons'), (snapshot) => {
      const addonsData = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name || '',
        price: d.data().price || 0,
        type: d.data().type || 'fixed',
      }))
      setAddons(addonsData)
    })

    // Listener untuk vouchers
    const unsubscribeVouchers = onSnapshot(collection(db, 'vouchers'), (snapshot) => {
      const vouchersData = snapshot.docs.map((d) => ({
        id: d.id,
        code: d.data().code || '',
        amount: d.data().amount || 0,
        active: d.data().active !== false,
        description: d.data().description || '',
        currentUsage: d.data().currentUsage || 0,
      }))
      setVouchers(vouchersData)
      setLoading(false)
    })

    // Cleanup function
    return () => {
      unsubscribeProducts()
      unsubscribeAddons()
      unsubscribeVouchers()
    }
  }, [])

  // 🔹 PRODUK HANDLERS
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('Nama dan harga produk harus diisi!')
      return
    }

    if (isAdding) return // Prevent multiple clicks
    setIsAdding(true)

    try {
      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description || '',
        hot: Boolean(newProduct.hot),
        thumbnail: newProduct.thumbnail || '',
        gallery: Array.isArray(newProduct.gallery) ? newProduct.gallery : [],
        createdAt: new Date()
      })
      
      // Reset form setelah berhasil
      setNewProduct({
        name: '',
        price: 0,
        description: '',
        hot: false,
        thumbnail: '',
        gallery: []
      })
      toast.success('Produk berhasil ditambahkan!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menambahkan produk!')
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return
    
    try {
      const docRef = doc(db, 'products', editingProduct.id)
      await updateDoc(docRef, {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        description: editingProduct.description,
        hot: Boolean(editingProduct.hot),
        thumbnail: editingProduct.thumbnail || '',
        gallery: Array.isArray(editingProduct.gallery) ? editingProduct.gallery : []
      })
      
      setEditingProduct(null)
      toast.success('Produk berhasil diperbarui!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menyimpan perubahan produk!')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return
    
    try {
      await deleteDoc(doc(db, 'products', productId))
      toast.success('Produk berhasil dihapus!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menghapus produk!')
    }
  }

  // Gallery handlers
  const addGalleryImage = (imageUrl: string, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      const currentGallery = newProduct.gallery || []
      if (currentGallery.length >= 3) {
        toast.error('Maksimal 3 gambar untuk gallery!')
        return
      }
      setNewProduct({
        ...newProduct,
        gallery: [...currentGallery, imageUrl]
      })
    } else if (editingProduct) {
      const currentGallery = editingProduct.gallery || []
      if (currentGallery.length >= 3) {
        toast.error('Maksimal 3 gambar untuk gallery!')
        return
      }
      setEditingProduct({
        ...editingProduct,
        gallery: [...currentGallery, imageUrl]
      })
    }
  }

  const removeGalleryImage = (index: number, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      const currentGallery = newProduct.gallery || []
      const updatedGallery = currentGallery.filter((_, i) => i !== index)
      setNewProduct({
        ...newProduct,
        gallery: updatedGallery
      })
    } else if (editingProduct) {
      const currentGallery = editingProduct.gallery || []
      const updatedGallery = currentGallery.filter((_, i) => i !== index)
      setEditingProduct({
        ...editingProduct,
        gallery: updatedGallery
      })
    }
  }

  // 🔹 ADDONS HANDLERS
  const handleAddAddon = async () => {
    if (!newAddon.name || !newAddon.price) {
      toast.error('Nama dan harga addon harus diisi!')
      return
    }

    if (isAdding) return // Prevent multiple clicks
    setIsAdding(true)

    try {
      await addDoc(collection(db, 'addons'), {
        name: newAddon.name,
        price: Number(newAddon.price),
        type: newAddon.type || 'fixed',
        createdAt: new Date()
      })
      
      // Reset form setelah berhasil
      setNewAddon({
        name: '',
        price: 0,
        type: 'fixed',
      })
      toast.success('Addon berhasil ditambahkan!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menambahkan addon!')
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateAddon = async () => {
    if (!editingAddon) return
    
    try {
      const docRef = doc(db, 'addons', editingAddon.id)
      await updateDoc(docRef, {
        name: editingAddon.name,
        price: Number(editingAddon.price),
        type: editingAddon.type,
      })
      
      setEditingAddon(null)
      toast.success('Addon berhasil diperbarui!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menyimpan perubahan addon!')
    }
  }

  const handleDeleteAddon = async (addonId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus addon ini?')) return
    
    try {
      await deleteDoc(doc(db, 'addons', addonId))
      toast.success('Addon berhasil dihapus!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menghapus addon!')
    }
  }

  // 🔹 VOUCHER HANDLERS
  const handleAddVoucher = async () => {
    if (!newVoucher.code || !newVoucher.amount) {
      toast.error('Kode dan jumlah voucher harus diisi!')
      return
    }

    // Check if voucher code already exists
    if (vouchers.some(v => v.code === newVoucher.code)) {
      toast.error('Kode voucher sudah ada!')
      return
    }

    if (isAdding) return // Prevent multiple clicks
    setIsAdding(true)

    try {
      await addDoc(collection(db, 'vouchers'), {
        code: newVoucher.code,
        amount: Number(newVoucher.amount),
        active: Boolean(newVoucher.active),
        description: newVoucher.description || '',
        currentUsage: 0,
        createdAt: new Date()
      })
      
      // Reset form setelah berhasil
      setNewVoucher({
        code: '',
        amount: 0,
        active: true,
        description: ''
      })
      toast.success('Voucher berhasil ditambahkan!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menambahkan voucher!')
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateVoucher = async () => {
    if (!editingVoucher) return
    
    try {
      const docRef = doc(db, 'vouchers', editingVoucher.id)
      await updateDoc(docRef, {
        code: editingVoucher.code,
        amount: Number(editingVoucher.amount),
        active: Boolean(editingVoucher.active),
        description: editingVoucher.description || ''
      })
      
      setEditingVoucher(null)
      toast.success('Voucher berhasil diperbarui!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menyimpan perubahan voucher!')
    }
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return
    
    try {
      await deleteDoc(doc(db, 'vouchers', voucherId))
      toast.success('Voucher berhasil dihapus!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menghapus voucher!')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Products, Addons & Vouchers</h2>

      {/* PRODUK SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">📦 Produk</h3>
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
            Total: {products.length} produk
          </div>
        </div>

        {/* Add New Product Form */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Nama Produk*</label>
            <Input
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Nama produk"
              className="bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Harga (Rp)*</label>
            <Input
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
              placeholder="0"
              className="bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-sm text-gray-700">Deskripsi</label>
            <Textarea
              rows={3}
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Deskripsi produk"
              className="bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Thumbnail URL</label>
            <Input
              value={newProduct.thumbnail}
              onChange={(e) => setNewProduct({ ...newProduct, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="bg-white"
            />
            {newProduct.thumbnail && (
              <div className="w-16 h-16 mt-2 border rounded overflow-hidden">
                <Image 
                  src={newProduct.thumbnail} 
                  alt="Thumbnail preview" 
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newProduct.hot}
              onChange={(e) => setNewProduct({ ...newProduct, hot: e.target.checked })}
              className="mr-2"
              id="hotProduct"
            />
            <label htmlFor="hotProduct" className="text-sm text-gray-700">Produk Hot</label>
          </div>
          
          {/* Gallery Input for New Product */}
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-sm text-gray-700">Gallery Images (Maksimal 3)</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="https://example.com/gallery-image.jpg"
                className="bg-white flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement
                    if (target.value.trim()) {
                      addGalleryImage(target.value.trim(), true)
                      target.value = ''
                    }
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="gallery-image"]') as HTMLInputElement
                  if (input?.value.trim()) {
                    addGalleryImage(input.value.trim(), true)
                    input.value = ''
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {newProduct.gallery?.map((image, index) => (
                <div key={index} className="relative">
                  <div className="w-16 h-16 border rounded overflow-hidden">
                    <Image 
                      src={image} 
                      alt={`Gallery ${index + 1}`} 
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeGalleryImage(index, true)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(!newProduct.gallery || newProduct.gallery.length === 0) && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  Belum ada gambar gallery
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <Button 
              onClick={handleAddProduct} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isAdding}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {isAdding ? 'Menambahkan...' : 'Tambah Produk'}
            </Button>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              {editingProduct?.id === product.id ? (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="bg-white"
                      placeholder="Nama produk"
                    />
                    <Input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="bg-white"
                      placeholder="Harga"
                    />
                    <div className="md:col-span-2">
                      <Textarea
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        rows={3}
                        className="bg-white"
                        placeholder="Deskripsi"
                      />
                    </div>
                    <Input
                      value={editingProduct.thumbnail || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, thumbnail: e.target.value })}
                      placeholder="Thumbnail URL"
                      className="bg-white"
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProduct.hot}
                        onChange={(e) => setEditingProduct({ ...editingProduct, hot: e.target.checked })}
                        className="mr-2"
                        id={`editHot-${product.id}`}
                      />
                      <label htmlFor={`editHot-${product.id}`} className="text-sm text-gray-700">Produk Hot</label>
                    </div>
                  </div>

                  {/* Gallery Editing */}
                  <div>
                    <label className="block mb-1 font-medium text-sm text-gray-700">Gallery Images (Maksimal 3)</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="https://example.com/gallery-image.jpg"
                        className="bg-white flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement
                            if (target.value.trim()) {
                              addGalleryImage(target.value.trim(), false)
                              target.value = ''
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          const input = document.querySelector(`input[placeholder*="gallery-image"]`) as HTMLInputElement
                          if (input?.value.trim()) {
                            addGalleryImage(input.value.trim(), false)
                            input.value = ''
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {editingProduct.gallery?.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="w-16 h-16 border rounded overflow-hidden">
                            <Image 
                              src={image} 
                              alt={`Gallery ${index + 1}`} 
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeGalleryImage(index, false)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {(!editingProduct.gallery || editingProduct.gallery.length === 0) && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          Belum ada gambar gallery
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProduct} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-1" />
                      Simpan
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>
                      <X className="h-4 w-4 mr-1" />
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{product.name}</h4>
                      {product.hot && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">HOT</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mb-3">
                      <span>Rp {product.price.toLocaleString('id-ID')}</span>
                    </div>
                    
                    {/* Thumbnail Display */}
                    {product.thumbnail && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 mb-1">Thumbnail:</p>
                        <div className="w-20 h-20 border rounded overflow-hidden">
                          <Image 
                            src={product.thumbnail} 
                            alt={product.name} 
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Gallery Display */}
                    {product.gallery && product.gallery.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Gallery ({product.gallery.length} gambar):</p>
                        <div className="flex gap-2 flex-wrap">
                          {product.gallery.map((image, index) => (
                            <div key={index} className="w-16 h-16 border rounded overflow-hidden">
                              <Image 
                                src={image} 
                                alt={`Gallery ${index + 1}`} 
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ADDONS SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">➕ Addons</h3>
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
            Total: {addons.length} addons
          </div>
        </div>

        {/* Add New Addon Form */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Nama Addon*</label>
            <Input
              value={newAddon.name}
              onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
              placeholder="Nama addon"
              className="bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Harga (Rp)*</label>
            <Input
              type="number"
              value={newAddon.price}
              onChange={(e) => setNewAddon({ ...newAddon, price: Number(e.target.value) })}
              placeholder="0"
              className="bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Tipe*</label>
            <select
              value={newAddon.type}
              onChange={(e) => setNewAddon({ ...newAddon, type: e.target.value as 'fixed' | 'per_item' })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fixed">Fixed (Harga tetap)</option>
              <option value="per_item">Per Item (Harga per item)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Button 
              onClick={handleAddAddon} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isAdding}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {isAdding ? 'Menambahkan...' : 'Tambah Addon'}
            </Button>
          </div>
        </div>

        {/* Addons List */}
        <div className="grid md:grid-cols-2 gap-4">
          {addons.map((addon) => (
            <div key={addon.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              {editingAddon?.id === addon.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingAddon.name}
                    onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                    className="bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={editingAddon.price}
                      onChange={(e) => setEditingAddon({ ...editingAddon, price: Number(e.target.value) })}
                      className="bg-white"
                    />
                    <select
                      value={editingAddon.type}
                      onChange={(e) => setEditingAddon({ ...editingAddon, type: e.target.value as 'fixed' | 'per_item' })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="per_item">Per Item</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateAddon} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-1" />
                      Simpan
                    </Button>
                    <Button variant="outline" onClick={() => setEditingAddon(null)}>
                      <X className="h-4 w-4 mr-1" />
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{addon.name}</h4>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Rp {addon.price.toLocaleString('id-ID')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        addon.type === 'fixed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {addon.type === 'fixed' ? 'Fixed' : 'Per Item'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAddon(addon)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddon(addon.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* VOUCHER SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">🎟 Voucher</h3>
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
            Total: {vouchers.length} voucher
          </div>
        </div>

        {/* Add New Voucher Form */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Kode Voucher*</label>
            <Input
              value={newVoucher.code}
              onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
              placeholder="KODE123"
              className="bg-white"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">Jumlah Potongan (Rp)*</label>
            <Input
              type="number"
              value={newVoucher.amount}
              onChange={(e) => setNewVoucher({ ...newVoucher, amount: Number(e.target.value) })}
              placeholder="0"
              className="bg-white"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newVoucher.active}
              onChange={(e) => setNewVoucher({ ...newVoucher, active: e.target.checked })}
              className="mr-2"
              id="activeVoucher"
            />
            <label htmlFor="activeVoucher" className="text-sm text-gray-700">Voucher Aktif</label>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-sm text-gray-700">Deskripsi</label>
            <Input
              value={newVoucher.description}
              onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
              placeholder="Deskripsi voucher"
              className="bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <Button 
              onClick={handleAddVoucher} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isAdding}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {isAdding ? 'Menambahkan...' : 'Tambah Voucher'}
            </Button>
          </div>
        </div>

        {/* Vouchers List */}
        <div className="grid md:grid-cols-2 gap-4">
          {vouchers.map((voucher) => (
            <div key={voucher.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              {editingVoucher?.id === voucher.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingVoucher.code}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, code: e.target.value.toUpperCase() })}
                    className="bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={editingVoucher.amount}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, amount: Number(e.target.value) })}
                      className="bg-white"
                    />
                  </div>
                  <Input
                    value={editingVoucher.description || ''}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, description: e.target.value })}
                    placeholder="Deskripsi"
                    className="bg-white"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingVoucher.active}
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, active: e.target.checked })}
                      className="mr-2"
                      id="editActiveVoucher"
                    />
                    <label htmlFor="editActiveVoucher" className="text-sm text-gray-700">Voucher Aktif</label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateVoucher} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-1" />
                      Simpan
                    </Button>
                    <Button variant="outline" onClick={() => setEditingVoucher(null)}>
                      <X className="h-4 w-4 mr-1" />
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{voucher.code}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        voucher.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {voucher.active ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{voucher.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Potongan: Rp {voucher.amount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingVoucher(voucher)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVoucher(voucher.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}