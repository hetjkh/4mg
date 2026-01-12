# Step-by-Step Guide: Product Translation

## ✅ What's Already Done

1. ✅ **Backend Model** - Supports multilingual schema (`title.en`, `title.gu`)
2. ✅ **Backend Routes** - Accepts `titleGu` and `descriptionGu` parameters
3. ✅ **Frontend Service** - `getProducts()` automatically returns data in selected language
4. ✅ **Language Header** - All API calls send `Accept-Language` header

## 🔧 What Needs to Be Done

### Option 1: Simple (Current - English Only)
- Products are created with English only
- Gujarati can be added later by editing
- Products display in user's selected language (if Gujarati translation exists)

### Option 2: Complete (Recommended - Both Languages)
- Update product form to include Gujarati fields
- Update service functions to send Gujarati data
- Users can create products with both languages at once

---

## 📝 Step-by-Step: Add Gujarati Fields to Product Form

### Step 1: Update Product Form State

In `app/products.tsx`, add Gujarati state variables:

```typescript
// Add these state variables (around line 23)
const [titleGu, setTitleGu] = useState('');
const [descriptionGu, setDescriptionGu] = useState('');
```

### Step 2: Update Form Reset Function

```typescript
const resetForm = () => {
  setTitle('');
  setDescription('');
  setTitleGu('');        // Add this
  setDescriptionGu('');  // Add this
  setPacketPrice('');
  setPacketsPerStrip('');
  setImage('');
  setImageUri(null);
  setStock('');
  setEditingProductId(null);
  setError('');
};
```

### Step 3: Update handleEdit Function

```typescript
const handleEdit = (product: Product) => {
  setEditingProductId(product.id);
  setTitle(product.title);
  setDescription(product.description || '');
  setTitleGu('');        // Will need to fetch from API (currently not available)
  setDescriptionGu('');  // Will need to fetch from API (currently not available)
  setPacketPrice(product.packetPrice.toString());
  setPacketsPerStrip(product.packetsPerStrip.toString());
  setImage(product.image);
  setImageUri(product.image);
  setStock(product.stock.toString());
  setShowForm(true);
  setError('');
};
```

### Step 4: Add Gujarati Input Fields in Form

In the form section (around line 350-400), add:

```typescript
{/* Title (English) */}
<TextInput
  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText, fontFamily: Fonts.regular }]}
  placeholder="Product Title (English) *"
  placeholderTextColor={colors.inputPlaceholder}
  value={title}
  onChangeText={(text) => { setTitle(text); setError(''); }}
  editable={!submitting}
/>

{/* Title (Gujarati) - Optional */}
<TextInput
  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText, fontFamily: Fonts.regular }]}
  placeholder="Product Title (Gujarati) - Optional"
  placeholderTextColor={colors.inputPlaceholder}
  value={titleGu}
  onChangeText={(text) => { setTitleGu(text); setError(''); }}
  editable={!submitting}
/>

{/* Description (English) */}
<TextInput
  style={[styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText, fontFamily: Fonts.regular }]}
  placeholder="Description (English) *"
  placeholderTextColor={colors.inputPlaceholder}
  value={description}
  onChangeText={(text) => { setDescription(text); setError(''); }}
  multiline
  numberOfLines={4}
  editable={!submitting}
/>

{/* Description (Gujarati) - Optional */}
<TextInput
  style={[styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText, fontFamily: Fonts.regular }]}
  placeholder="Description (Gujarati) - Optional"
  placeholderTextColor={colors.inputPlaceholder}
  value={descriptionGu}
  onChangeText={(text) => { setDescriptionGu(text); setError(''); }}
  multiline
  numberOfLines={4}
  editable={!submitting}
/>
```

### Step 5: Update Service Functions

Update `services/productService.ts`:

**Option A: Update createProduct signature (Recommended)**

```typescript
// Update createProduct function
export const createProduct = async (
  title: string,
  description: string,
  packetPrice: number,
  packetsPerStrip: number,
  image: string,
  stock: number,
  titleGu?: string,      // Add optional parameter
  descriptionGu?: string // Add optional parameter
): Promise<ProductResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const language = await getLanguage();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
      },
      body: JSON.stringify({ 
        title, 
        description, 
        packetPrice, 
        packetsPerStrip, 
        image, 
        stock,
        titleGu,        // Add this
        descriptionGu   // Add this
      }),
    });
    // ... rest of function
  }
};
```

**Option B: Use object parameter (Better for future)**

```typescript
// Better approach - use object parameter
export interface CreateProductData {
  title: string;
  description: string;
  packetPrice: number;
  packetsPerStrip: number;
  image: string;
  stock: number;
  titleGu?: string;
  descriptionGu?: string;
}

export const createProduct = async (
  data: CreateProductData
): Promise<ProductResponse> => {
  // ... implementation
  body: JSON.stringify(data),
};
```

### Step 6: Update handleSubmit Function

```typescript
const handleSubmit = async () => {
  // ... validation code ...

  try {
    if (editingProductId) {
      // Update existing product
      await updateProduct(
        editingProductId,
        title.trim(),
        description.trim(),
        packetPriceNum,
        packetsPerStripNum,
        image.trim(),
        stockNum,
        titleGu.trim() || undefined,      // Add this
        descriptionGu.trim() || undefined // Add this
      );
    } else {
      // Create new product
      await createProduct(
        title.trim(),
        description.trim(),
        packetPriceNum,
        packetsPerStripNum,
        image.trim(),
        stockNum,
        titleGu.trim() || undefined,      // Add this
        descriptionGu.trim() || undefined // Add this
      );
    }
    // ... rest of function
  }
};
```

### Step 7: Update updateProduct Function (Same as createProduct)

```typescript
export const updateProduct = async (
  id: string,
  title: string,
  description: string,
  packetPrice: number,
  packetsPerStrip: number,
  image: string,
  stock: number,
  titleGu?: string,      // Add optional parameter
  descriptionGu?: string // Add optional parameter
): Promise<ProductResponse> => {
  // ... same pattern as createProduct
  body: JSON.stringify({ 
    title, 
    description, 
    packetPrice, 
    packetsPerStrip, 
    image, 
    stock,
    titleGu,        // Add this
    descriptionGu   // Add this
  }),
};
```

---

## 🧪 Testing

### Test 1: Create Product with Both Languages

1. Go to Products page
2. Click "Add Product"
3. Fill in:
   - Title (English): "Paracetamol 500mg"
   - Title (Gujarati): "પેરાસિટામોલ 500mg"
   - Description (English): "Pain relief medicine"
   - Description (Gujarati): "પીડા ઉપશામક દવા"
   - Other fields...
4. Click "Create Product"
5. Product should be saved with both languages

### Test 2: View Products in Different Languages

1. **English Mode:**
   - Set language to English (EN button in sidebar)
   - Go to Products page
   - Products should show English titles/descriptions

2. **Gujarati Mode:**
   - Set language to Gujarati (GU button in sidebar)
   - Go to Products page
   - Products should show Gujarati titles/descriptions

---

## 🎯 Quick Start (Minimal Changes)

If you want to test it quickly without updating the form:

### Backend API Direct Call:

```bash
POST /api/products
Headers:
  Authorization: Bearer <token>
  Accept-Language: en
  Content-Type: application/json

Body:
{
  "title": "Paracetamol 500mg",
  "description": "Pain relief medicine",
  "titleGu": "પેરાસિટામોલ 500mg",
  "descriptionGu": "પીડા ઉપશામક દવા",
  "packetPrice": 50,
  "packetsPerStrip": 10,
  "image": "https://example.com/image.jpg",
  "stock": 100
}
```

Then fetch products - they'll automatically show in the user's selected language!

---

## ✅ Summary

**Current Status:**
- ✅ Backend ready (accepts `titleGu`, `descriptionGu`)
- ✅ Reading products works (automatic language selection)
- ⚠️ Creating products - needs form update (Gujarati fields optional)

**To Complete:**
1. Add Gujarati input fields to product form
2. Update `createProduct` and `updateProduct` service functions
3. Update `handleSubmit` to include Gujarati data

**The system will automatically:**
- Store both languages in database
- Return products in user's selected language
- Fallback to English if Gujarati not available

