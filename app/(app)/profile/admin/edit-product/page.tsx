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
  slug: string 
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
  percentage: number
  active: boolean
  description?: string
  currentUsage?: number
}

export default function EditLayoutPage() {
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
  const [galleryInputEdit, setGalleryInputEdit] = useState('')
  const [galleryInputNew, setGalleryInputNew] = useState('')

  const [addons, setAddons] = useState<Addon[]>([])
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [newAddon, setNewAddon] = useState<Partial<Addon>>({
    name: '',
    price: 0,
    type: 'fixed',
  })

  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [newVoucher, setNewVoucher] = useState<Partial<Voucher>>({
    code: '',
    percentage: 0,
    active: true,
    description: ''
  })

  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'addons' | 'vouchers'>('products')

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name || '',
        price: d.data().price || 0,
        description: d.data().description || '',
        hot: d.data().hot || false,
        thumbnail: d.data().thumbnail || '',
        gallery: Array.isArray(d.data().gallery) ? d.data().gallery : [],
        slug: d.data().slug || '', 
      }))
      setProducts(productsData)
    })

    const unsubscribeAddons = onSnapshot(collection(db, 'addons'), (snapshot) => {
      const addonsData = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name || '',
        price: d.data().price || 0,
        type: d.data().type || 'fixed',
      }))
      setAddons(addonsData)
    })

    const unsubscribeVouchers = onSnapshot(collection(db, 'vouchers'), (snapshot) => {
      const vouchersData = snapshot.docs.map((d) => ({
        id: d.id,
        code: d.data().code || '',
        percentage: d.data().percentage || d.data().amount || 0,
        active: d.data().active !== false,
        description: d.data().description || '',
        currentUsage: d.data().currentUsage || 0,
      }))
      setVouchers(vouchersData)
      setLoading(false)
    })

    return () => {
      unsubscribeProducts()
      unsubscribeAddons()
      unsubscribeVouchers()
    }
  }, [])

  const handleAddProduct = async () => {
  if (!newProduct.name || !newProduct.price) {
    toast.error('Nama dan harga produk harus diisi!')
    return
  }

  if (isAdding) return
  setIsAdding(true)

  try {
    // Generate slug dari nama produk
    const slug = newProduct.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')

    await addDoc(collection(db, 'products'), {
      name: newProduct.name,
      price: Number(newProduct.price),
      description: newProduct.description || '',
      hot: Boolean(newProduct.hot),
      thumbnail: newProduct.thumbnail || '',
      gallery: Array.isArray(newProduct.gallery) ? newProduct.gallery : [],
      slug: slug, 
      createdAt: new Date()
    })
    
    setNewProduct({
      name: '',
      price: 0,
      description: '',
      hot: false,
      thumbnail: '',
      gallery: []
    })
    setGalleryInputNew('')
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
    // Generate slug baru jika nama berubah
    const slug = editingProduct.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')

    const docRef = doc(db, 'products', editingProduct.id)
    await updateDoc(docRef, {
      name: editingProduct.name,
      price: Number(editingProduct.price),
      description: editingProduct.description,
      hot: Boolean(editingProduct.hot),
      thumbnail: editingProduct.thumbnail || '',
      gallery: Array.isArray(editingProduct.gallery) ? editingProduct.gallery : [],
      slug: slug // Tambahkan slug
    })
    
    setEditingProduct(null)
    setGalleryInputEdit('')
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

  const addGalleryImage = (imageUrl: string, isNewProduct: boolean = false) => {
    if (!imageUrl.trim()) {
      toast.error('URL gambar tidak boleh kosong!')
      return
    }

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
      setGalleryInputNew('')
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
      setGalleryInputEdit('')
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

  const handleAddAddon = async () => {
    if (!newAddon.name || !newAddon.price) {
      toast.error('Nama dan harga addon harus diisi!')
      return
    }

    if (isAdding) return
    setIsAdding(true)

    try {
      await addDoc(collection(db, 'addons'), {
        name: newAddon.name,
        price: Number(newAddon.price),
        type: newAddon.type || 'fixed',
        createdAt: new Date()
      })
      
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

  const handleAddVoucher = async () => {
    if (!newVoucher.code || !newVoucher.percentage) {
      toast.error('Kode dan persentase voucher harus diisi!')
      return
    }

    if (newVoucher.percentage < 0 || newVoucher.percentage > 100) {
      toast.error('Persentase harus antara 0-100!')
      return
    }

    if (vouchers.some(v => v.code === newVoucher.code)) {
      toast.error('Kode voucher sudah ada!')
      return
    }

    if (isAdding) return
    setIsAdding(true)

    try {
      await addDoc(collection(db, 'vouchers'), {
        code: newVoucher.code,
        percentage: Number(newVoucher.percentage),
        active: Boolean(newVoucher.active),
        description: newVoucher.description || '',
        currentUsage: 0,
        createdAt: new Date()
      })
      
      setNewVoucher({
        code: '',
        percentage: 0,
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

    if (editingVoucher.percentage < 0 || editingVoucher.percentage > 100) {
      toast.error('Persentase harus antara 0-100!')
      return
    }
    
    try {
      const docRef = doc(db, 'vouchers', editingVoucher.id)
      await updateDoc(docRef, {
        code: editingVoucher.code,
        percentage: Number(editingVoucher.percentage),
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
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">Manage Packages</h1>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'products'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📦 Produk ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'addons'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ➕ Addons ({addons.length})
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'vouchers'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🎟 Voucher ({vouchers.length})
            </button>
          </div>
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Add Product Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Tambah Produk Baru</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Nama Produk*</label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nama produk"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Harga (Rp)*</label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium text-sm text-gray-700">Deskripsi</label>
                  <Textarea
                    rows={3}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Deskripsi produk"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Thumbnail URL</label>
                  <Input
                    value={newProduct.thumbnail}
                    onChange={(e) => setNewProduct({ ...newProduct, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {newProduct.thumbnail && (
                    <div className="w-20 h-20 mt-3 border-2 rounded-lg overflow-hidden">
                      <Image 
                        src={newProduct.thumbnail} 
                        alt="Thumbnail preview" 
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    checked={newProduct.hot}
                    onChange={(e) => setNewProduct({ ...newProduct, hot: e.target.checked })}
                    className="w-4 h-4 mr-2"
                    id="hotProduct"
                  />
                  <label htmlFor="hotProduct" className="text-sm text-gray-700 font-medium">
                    🔥 Tandai sebagai Produk Hot
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium text-sm text-gray-700">
                    Gallery Images (Maksimal 3)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={galleryInputNew}
                      onChange={(e) => setGalleryInputNew(e.target.value)}
                      placeholder="https://example.com/gallery-image.jpg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addGalleryImage(galleryInputNew, true)
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => addGalleryImage(galleryInputNew, true)}
                      className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {newProduct.gallery?.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 border-2 rounded-lg overflow-hidden">
                          <Image 
                            src={image} 
                            alt={`Gallery ${index + 1}`} 
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeGalleryImage(index, true)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <Button 
                    onClick={handleAddProduct} 
                    className="bg-green-600 hover:bg-green-700 px-6"
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Produk
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {editingProduct?.id === product.id ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 font-medium text-sm text-gray-700">Nama Produk</label>
                          <Input
                            value={editingProduct.name}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-sm text-gray-700">Harga (Rp)</label>
                          <Input
                            type="number"
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-2 font-medium text-sm text-gray-700">Deskripsi</label>
                          <Textarea
                            value={editingProduct.description}
                            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-sm text-gray-700">Thumbnail URL</label>
                          <Input
                            value={editingProduct.thumbnail || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, thumbnail: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center pt-8">
                          <input
                            type="checkbox"
                            checked={editingProduct.hot}
                            onChange={(e) => setEditingProduct({ ...editingProduct, hot: e.target.checked })}
                            className="w-4 h-4 mr-2"
                            id={`editHot-${product.id}`}
                          />
                          <label htmlFor={`editHot-${product.id}`} className="text-sm text-gray-700 font-medium">
                            🔥 Produk Hot
                          </label>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-2 font-medium text-sm text-gray-700">Gallery Images</label>
                          <div className="flex gap-2 mb-3">
                            <Input
                              value={galleryInputEdit}
                              onChange={(e) => setGalleryInputEdit(e.target.value)}
                              placeholder="https://example.com/gallery-image.jpg"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addGalleryImage(galleryInputEdit, false)
                                }
                              }}
                            />
                            <Button 
                              type="button" 
                              onClick={() => addGalleryImage(galleryInputEdit, false)}
                              className="bg-blue-600 hover:bg-blue-700 shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            {editingProduct.gallery?.map((image, index) => (
                              <div key={index} className="relative group">
                                <div className="w-20 h-20 border-2 rounded-lg overflow-hidden">
                                  <Image 
                                    src={image} 
                                    alt={`Gallery ${index + 1}`} 
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => removeGalleryImage(index, false)}
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleUpdateProduct} className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4 mr-2" />
                          Simpan Perubahan
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setEditingProduct(null)
                          setGalleryInputEdit('')
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-bold text-lg text-gray-900">{product.name}</h4>
                          {product.hot && (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                              🔥 HOT
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{product.description}</p>
                        <p className="text-xl font-semibold text-green-600 mb-4">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                        
                        <div className="flex gap-4">
                          {product.thumbnail && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Thumbnail:</p>
                              <div className="w-24 h-24 border-2 rounded-lg overflow-hidden">
                                <Image 
                                  src={product.thumbnail} 
                                  alt={product.name} 
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}

                          {product.gallery && product.gallery.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Gallery ({product.gallery.length}):
                              </p>
                              <div className="flex gap-2">
                                {product.gallery.map((image, index) => (
                                  <div key={index} className="w-20 h-20 border-2 rounded-lg overflow-hidden">
                                    <Image 
                                      src={image} 
                                      alt={`Gallery ${index + 1}`} 
                                      width={80}
                                      height={80}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                          className="whitespace-nowrap"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADDONS TAB */}
        {activeTab === 'addons' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Tambah Addon Baru</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Nama Addon*</label>
                  <Input
                    value={newAddon.name}
                    onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                    placeholder="Nama addon"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Harga (Rp)*</label>
                  <Input
                    type="number"
                    value={newAddon.price}
                    onChange={(e) => setNewAddon({ ...newAddon, price: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Tipe*</label>
                  <select
                    value={newAddon.type}
                    onChange={(e) => setNewAddon({ ...newAddon, type: e.target.value as 'fixed' | 'per_item' })}
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed (Harga tetap)</option>
                    <option value="per_item">Per Item (Harga per item)</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <Button 
                    onClick={handleAddAddon} 
                    className="bg-green-600 hover:bg-green-700 px-6"
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Addon
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {addons.map((addon) => (
                <div key={addon.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {editingAddon?.id === addon.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Nama Addon</label>
                        <Input
                          value={editingAddon.name}
                          onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-2 font-medium text-sm text-gray-700">Harga</label>
                          <Input
                            type="number"
                            value={editingAddon.price}
                            onChange={(e) => setEditingAddon({ ...editingAddon, price: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-sm text-gray-700">Tipe</label>
                          <select
                            value={editingAddon.type}
                            onChange={(e) => setEditingAddon({ ...editingAddon, type: e.target.value as 'fixed' | 'per_item' })}
                            className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="fixed">Fixed</option>
                            <option value="per_item">Per Item</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleUpdateAddon} className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4 mr-2" />
                          Simpan
                        </Button>
                        <Button variant="outline" onClick={() => setEditingAddon(null)}>
                          <X className="h-4 w-4 mr-2" />
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900 mb-2">{addon.name}</h4>
                        <p className="text-xl font-semibold text-green-600 mb-2">
                          Rp {addon.price.toLocaleString('id-ID')}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          addon.type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {addon.type === 'fixed' ? '📌 Fixed' : '🔢 Per Item'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        )}

        {/* VOUCHERS TAB */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Tambah Voucher Baru</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Kode Voucher*</label>
                  <Input
                    value={newVoucher.code}
                    onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                    placeholder="KODE123"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-sm text-gray-700">Diskon (%)*</label>
                  <Input
                    type="number"
                    value={newVoucher.percentage}
                    onChange={(e) => setNewVoucher({ ...newVoucher, percentage: Number(e.target.value) })}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium text-sm text-gray-700">Deskripsi</label>
                  <Input
                    value={newVoucher.description}
                    onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                    placeholder="Deskripsi voucher"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newVoucher.active}
                    onChange={(e) => setNewVoucher({ ...newVoucher, active: e.target.checked })}
                    className="w-4 h-4 mr-2"
                    id="activeVoucher"
                  />
                  <label htmlFor="activeVoucher" className="text-sm text-gray-700 font-medium">
                    ✅ Voucher Aktif
                  </label>
                </div>
                <div className="md:col-span-2">
                  <Button 
                    onClick={handleAddVoucher} 
                    className="bg-green-600 hover:bg-green-700 px-6"
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Voucher
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {editingVoucher?.id === voucher.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Kode Voucher</label>
                        <Input
                          value={editingVoucher.code}
                          onChange={(e) => setEditingVoucher({ ...editingVoucher, code: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Diskon (%)</label>
                        <Input
                          type="number"
                          value={editingVoucher.percentage}
                          onChange={(e) => setEditingVoucher({ ...editingVoucher, percentage: Number(e.target.value) })}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">Deskripsi</label>
                        <Input
                          value={editingVoucher.description || ''}
                          onChange={(e) => setEditingVoucher({ ...editingVoucher, description: e.target.value })}
                          placeholder="Deskripsi"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingVoucher.active}
                          onChange={(e) => setEditingVoucher({ ...editingVoucher, active: e.target.checked })}
                          className="w-4 h-4 mr-2"
                          id="editActiveVoucher"
                        />
                        <label htmlFor="editActiveVoucher" className="text-sm text-gray-700 font-medium">
                          Voucher Aktif
                        </label>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleUpdateVoucher} className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4 mr-2" />
                          Simpan
                        </Button>
                        <Button variant="outline" onClick={() => setEditingVoucher(null)}>
                          <X className="h-4 w-4 mr-2" />
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-lg text-gray-900">{voucher.code}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            voucher.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {voucher.active ? '✅ AKTIF' : '❌ NON-AKTIF'}
                          </span>
                        </div>
                        {voucher.description && (
                          <p className="text-gray-600 text-sm mb-3">{voucher.description}</p>
                        )}
                        <p className="text-2xl font-bold text-orange-600">
                          {voucher.percentage}% OFF
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        )}
      </div>
    </div>
  )
}