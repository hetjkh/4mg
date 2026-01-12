# Product API Translation Flow

## How Product Translation Works

The product translation system uses a **multilingual database schema** approach where product data is stored with both English and Gujarati translations in the database.

---

## 🔄 Complete Flow

### 1. **Database Storage** (Multilingual Schema)

Products are stored in MongoDB with multilingual fields:

```javascript
{
  title: {
    en: "Paracetamol 500mg",
    gu: "પેરાસિટામોલ 500mg"
  },
  description: {
    en: "Pain relief medicine",
    gu: "પીડા ઉપશામક દવા"
  },
  packetPrice: 50,
  packetsPerStrip: 10,
  image: "https://...",
  stock: 100
}
```

---

### 2. **Frontend Request** 

When the frontend requests products, it automatically includes the user's selected language:

**File: `services/productService.ts`**
```typescript
export const getProducts = async (): Promise<Product[]> => {
  const token = await getToken();
  const language = await getLanguage(); // Gets 'en' or 'gu' from SecureStore
  
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept-Language': language, // 👈 Language sent to backend
    },
  });
  // ...
};
```

**File: `utils/apiHelpers.ts`**
```typescript
export const getLanguage = async (): Promise<string> => {
  const language = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
  return language === 'gu' || language === 'en' ? language : 'en';
};
```

---

### 3. **Backend Processing**

**File: `backend/routes/products.js`**

The backend receives the request and extracts the language:

```javascript
// GET /api/products
router.get('/', verifyToken, async (req, res) => {
  const language = getLanguage(req); // Extracts 'en' or 'gu' from Accept-Language header
  
  const products = await Product.find()
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      // 👇 formatProduct returns only the selected language
      products: products.map(product => formatProduct(product, language)),
    },
  });
});
```

**Language Extraction:**
```javascript
// backend/middleware/translateMessages.js
const getLanguage = (req) => {
  const acceptLanguage = req.headers['accept-language'] || 'en';
  const language = acceptLanguage.split(',')[0].split('-')[0].trim().toLowerCase();
  return (language === 'gu' || language === 'en') ? language : 'en';
};
```

---

### 4. **Format Product Function**

**File: `backend/routes/products.js`**

The `formatProduct` function selects the correct language:

```javascript
const formatProduct = (product, language = 'en') => {
  // Handle both old format (string) and new format (object)
  const title = typeof product.title === 'string' 
    ? product.title  // Old format - return as is
    : (product.title[language] || product.title.en || product.title.gu || '');
    // 👆 New format - get language-specific title
  
  const description = typeof product.description === 'string'
    ? product.description
    : (product.description[language] || product.description.en || product.description.gu || '');

  return {
    id: product._id,
    title,        // 👈 Single language string (en or gu)
    description,  // 👈 Single language string (en or gu)
    packetPrice: product.packetPrice,
    packetsPerStrip: product.packetsPerStrip,
    image: product.image,
    stock: product.stock,
    // ...
  };
};
```

**Fallback Logic:**
1. Try to get the requested language (`product.title[language]`)
2. If not found, fallback to English (`product.title.en`)
3. If English not found, fallback to Gujarati (`product.title.gu`)
4. If nothing found, return empty string (``)

---

### 5. **Frontend Response**

The frontend receives products in the selected language:

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "123",
        "title": "પેરાસિટામોલ 500mg",  // 👈 Gujarati (if language='gu')
        "description": "પીડા ઉપશામક દવા",
        "packetPrice": 50,
        "packetsPerStrip": 10,
        "image": "https://...",
        "stock": 100
      }
    ]
  }
}
```

---

## 📝 Creating/Updating Products

When creating or updating products, you can send both languages:

**Create Product:**
```javascript
// POST /api/products
{
  title: "Paracetamol 500mg",        // English (required)
  description: "Pain relief medicine",
  titleGu: "પેરાસિટામોલ 500mg",      // Gujarati (optional)
  descriptionGu: "પીડા ઉપશામક દવા",
  packetPrice: 50,
  packetsPerStrip: 10,
  image: "https://...",
  stock: 100
}
```

The backend stores it as:
```javascript
{
  title: {
    en: "Paracetamol 500mg",
    gu: "પેરાસિટામોલ 500mg"
  },
  description: {
    en: "Pain relief medicine",
    gu: "પીડા ઉપશામક દવા"
  },
  // ... other fields
}
```

---

## 🎯 Key Points

1. **Storage**: Products are stored with both languages in the database
2. **Request**: Frontend sends `Accept-Language: en` or `Accept-Language: gu` header
3. **Processing**: Backend extracts language from header and uses `formatProduct()`
4. **Response**: Frontend receives products in the selected language
5. **Fallback**: If requested language is missing, falls back to English → Gujarati → empty string

---

## 🔍 Example Flow

**User selects Gujarati language:**
1. User clicks "GU" in sidebar → Language saved to SecureStore as `'gu'`
2. User navigates to Products page → `getProducts()` is called
3. `getLanguage()` reads `'gu'` from SecureStore
4. Request sent with `Accept-Language: gu` header
5. Backend extracts `'gu'` from header
6. `formatProduct(product, 'gu')` returns Gujarati title/description
7. Frontend displays products in Gujarati

**User switches to English:**
1. User clicks "EN" in sidebar → Language saved to SecureStore as `'en'`
2. `getProducts()` reads `'en'` from SecureStore
3. Request sent with `Accept-Language: en` header
4. Backend returns English title/description
5. Frontend displays products in English

---

## 📊 Summary

| Component | Responsibility |
|-----------|---------------|
| **Database** | Stores multilingual data (title.en, title.gu) |
| **Frontend Service** | Sends `Accept-Language` header with user's language |
| **Backend Route** | Extracts language from header |
| **formatProduct()** | Returns single-language product data |
| **API Response** | Contains products in selected language |

This approach ensures:
- ✅ Products are stored with all translations
- ✅ Users get data in their preferred language
- ✅ No client-side translation needed for product data
- ✅ Backward compatible (supports old string format)
- ✅ Efficient (language selection happens at database query level)

