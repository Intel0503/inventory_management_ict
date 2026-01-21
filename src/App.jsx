import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Edit2,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

// Mock Supabase client (replace with actual supabase import)

function App() {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    quantity: 0,
    min_quantity: 0,
    price: '',
  });

  const [transactionData, setTransactionData] = useState({
    type: 'IN',
    quantity: 0,
    notes: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    // Replace with: const { data, error } = await supabase.from('products').select('*')
    const { data, error } = await supabase.from('products').select();

    if (error) {
      alert('Error loading products: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedProduct) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update(formData)
        .eq('id', selectedProduct.id);

      if (error) {
        alert('Error updating product: ' + error.message);
      } else {
        await loadProducts();
        resetForm();
      }
    } else {
      // Add new product
      const { error } = await supabase.from('products').insert([formData]);

      if (error) {
        alert('Error adding product: ' + error.message);
      } else {
        await loadProducts();
        resetForm();
      }
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();

    const quantityChange =
      transactionData.type === 'IN'
        ? parseInt(transactionData.quantity)
        : -parseInt(transactionData.quantity);

    const newQuantity = selectedProduct.quantity + quantityChange;

    if (newQuantity < 0) {
      alert('Insufficient stock!');
      return;
    }

    // Update product quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', selectedProduct.id);

    // Record transaction
    const { error: transError } = await supabase
      .from('inventory_transactions')
      .insert([
        {
          product_id: selectedProduct.id,
          transaction_type: transactionData.type,
          quantity: Math.abs(quantityChange),
          notes: transactionData.notes,
        },
      ]);

    if (updateError || transError) {
      alert('Error processing transaction');
    } else {
      await loadProducts();
      setShowTransactionModal(false);
      setTransactionData({ type: 'IN', quantity: 0, notes: '' });
      setSelectedProduct(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      alert('Error deleting product: ' + error.message);
    } else {
      await loadProducts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      quantity: 0,
      min_quantity: 0,
      price: '',
    });
    setSelectedProduct(null);
    setShowAddModal(false);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData(product);
    setShowAddModal(true);
  };

  const openTransactionModal = (product) => {
    setSelectedProduct(product);
    setShowTransactionModal(true);
  };

  const filteredProducts = products.filter((p) => {
    if (filter === 'low') return p.quantity <= p.min_quantity;
    if (filter === 'out') return p.quantity === 0;
    return true;
  });

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => p.quantity <= p.min_quantity).length,
    outOfStock: products.filter((p) => p.quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + p.quantity * p.price, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Inventory Management
          </h1>
          <p className="text-gray-600">Manage your products and stock levels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Low Stock</p>
                <p className="text-3xl font-bold text-orange-500">
                  {stats.lowStock}
                </p>
              </div>
              <AlertCircle className="text-orange-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Out of Stock</p>
                <p className="text-3xl font-bold text-red-500">
                  {stats.outOfStock}
                </p>
              </div>
              <TrendingDown className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Value</p>
                <p className="text-3xl font-bold text-green-500">
                  ${stats.totalValue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              All Products
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded ${filter === 'low' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-4 py-2 rounded ${filter === 'out' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              Out of Stock
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">
                  SKU
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Product Name
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Category
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Quantity
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Price
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-500">
                    No products found. Add your first product to get started!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{product.sku}</td>
                    <td className="p-4">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {product.description}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-semibold ${
                          product.quantity === 0
                            ? 'text-red-500'
                            : product.quantity <= product.min_quantity
                              ? 'text-orange-500'
                              : 'text-green-500'
                        }`}
                      >
                        {product.quantity}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {' '}
                        / {product.min_quantity} min
                      </span>
                    </td>
                    <td className="p-4 font-semibold">
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openTransactionModal(product)}
                          className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                          title="Add/Remove Stock"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Initial Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Minimum Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {selectedProduct ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTransactionModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Stock Transaction</h2>
              <div className="mb-4 p-4 bg-gray-100 rounded">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">
                  Current Stock: {selectedProduct.quantity}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transaction Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="IN"
                        checked={transactionData.type === 'IN'}
                        onChange={(e) =>
                          setTransactionData({
                            ...transactionData,
                            type: e.target.value,
                          })
                        }
                        className="mr-2"
                      />
                      Stock In
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="OUT"
                        checked={transactionData.type === 'OUT'}
                        onChange={(e) =>
                          setTransactionData({
                            ...transactionData,
                            type: e.target.value,
                          })
                        }
                        className="mr-2"
                      />
                      Stock Out
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transactionData.quantity}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        quantity: e.target.value,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <textarea
                    value={transactionData.notes}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        notes: e.target.value,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowTransactionModal(false);
                      setTransactionData({
                        type: 'IN',
                        quantity: 0,
                        notes: '',
                      });
                      setSelectedProduct(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransaction}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Process Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
