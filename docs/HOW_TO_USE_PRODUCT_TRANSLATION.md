# How to Use Product Translation

## 📋 Quick Guide

This guide shows you how to create, update, and use products with translations.

---

## 1. 🆕 Creating Products with Translations

### Backend API

When creating a product, send both English and Gujarati translations:

**POST** `/api/products`

```json
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

**Or use object format:**

```json
{
  "title": {
    "en": "Paracetamol 500mg",
    "gu": "પેરાસિટામોલ 500mg"
  },
  "description": {
    "en": "Pain relief medicine",
    "gu": "પીડા ઉપશામક દવા"
  },
  "packetPrice": 50,
  "packetsPerStrip": 10,
  "image": "https://example.com/image.jpg",
  "stock": 100
}
```

**Note:** English (`title`, `description`) is **required**. Gujarati (`titleGu`, `descriptionGu`) is **optional** but recommended.

---

## 2. 📝 Frontend Service Usage

### Create Product (TypeScript)

```typescript
import { createProduct } from '@/services/productService';

// Create product with translations
await createProduct({
  title: "Paracetamol 500mg",
  description: "Pain relief medicine",
  titleGu: "પેરાસિટામોલ 500mg",           // Optional
  descriptionGu: "પીડા ઉપશામક દવા",        // Optional
  packetPrice: 50,
  packetsPerStrip: 10,
  image: "https://example.com/image.jpg",
  stock: 100
});
```

### Get Products (Automatic Translation)

```typescript
import { getProducts } from '@/services/productService';

// Products are automatically returned in user's selected language
const products = await getProducts();

// If user selected Gujarati, products will be:
// products[0].title = "પેરાસિટામોલ 500mg"
// products[0].description = "પીડા ઉપશામક દવા"

// If user selected English, products will be:
// products[0].title = "Paracetamol 500mg"
// products[0].description = "Pain relief medicine"
```

The language is automatically detected from the user's language preference stored in SecureStore.

---

## 3. 🔄 Updating Products

### Update Product (Backend API)

**PUT** `/api/products/:id`

```json
{
  "title": "Updated Paracetamol",
  "description": "Updated description",
  "titleGu": "અપડેટ પેરાસિટામોલ",
  "descriptionGu": "અપડેટ વર્ણન",
  "packetPrice": 55,
  "packetsPerStrip": 10,
  "image": "https://example.com/new-image.jpg",
  "stock": 150
}
```

**Frontend:**

```typescript
import { updateProduct } from '@/services/productService';

await updateProduct(productId, {
  title: "Updated Paracetamol",
  description: "Updated description",
  titleGu: "અપડેટ પેરાસિટામોલ",
  descriptionGu: "અપડેટ વર્ણન",
  packetPrice: 55,
  packetsPerStrip: 10,
  image: "https://example.com/new-image.jpg",
  stock: 150
});
```

---

## 4. 🧪 Testing Product Translation

### Test Scenario 1: Create Product with Both Languages

1. **Create a product:**
   ```bash
   POST /api/products
   {
     "title": "Aspirin",
     "description": "Blood thinner",
     "titleGu": "એસ્પિરિન",
     "descriptionGu": "રક્ત પાતળું કરનાર",
     "packetPrice": 30,
     "packetsPerStrip": 10,
     "image": "https://example.com/aspirin.jpg",
     "stock": 50
   }
   ```

2. **Fetch products in English:**
   ```bash
   GET /api/products
   Headers: Accept-Language: en
   ```
   Response:
   ```json
   {
     "title": "Aspirin",
     "description": "Blood thinner"
   }
   ```

3. **Fetch products in Gujarati:**
   ```bash
   GET /api/products
   Headers: Accept-Language: gu
   ```
   Response:
   ```json
   {
     "title": "એસ્પિરિન",
     "description": "રક્ત પાતળું કરનાર"
   }
   ```

---

## 5. 🗄️ Migrating Existing Products

If you have existing products with string format (old format), run the migration script:

```bash
cd backend
node scripts/migrateProducts.js
```

This will:
- Convert old string format → new multilingual object format
- Keep existing English text
- Set Gujarati to empty string (you can update later)

**Before migration:**
```javascript
{
  title: "Paracetamol",      // String
  description: "Pain relief" // String
}
```

**After migration:**
```javascript
{
  title: {
    en: "Paracetamol",    // Preserved
    gu: ""                 // Empty (can update later)
  },
  description: {
    en: "Pain relief",    // Preserved
    gu: ""                 // Empty (can update later)
  }
}
```

---

## 6. 🎨 Frontend Form Example

When building a product creation form, include fields for both languages:

```typescript
// Product Form Component
const [formData, setFormData] = useState({
  title: "",
  description: "",
  titleGu: "",
  descriptionGu: "",
  packetPrice: 0,
  packetsPerStrip: 0,
  image: "",
  stock: 0
});

const handleSubmit = async () => {
  await createProduct({
    title: formData.title,
    description: formData.description,
    titleGu: formData.titleGu,           // Optional but recommended
    descriptionGu: formData.descriptionGu, // Optional but recommended
    packetPrice: formData.packetPrice,
    packetsPerStrip: formData.packetsPerStrip,
    image: formData.image,
    stock: formData.stock
  });
};
```

---

## 7. ⚠️ Important Notes

1. **English is Required**: `title` and `description` (English) are required fields
2. **Gujarati is Optional**: `titleGu` and `descriptionGu` can be empty, but users won't see Gujarati translations
3. **Automatic Language Selection**: Products are automatically returned in the user's selected language (no extra code needed)
4. **Fallback**: If requested language is missing, falls back to English → Gujarati → empty string
5. **Backward Compatible**: System supports both old (string) and new (object) formats

---

## 8. 🔍 Checking Product Data

To see how products are stored in the database:

```javascript
// MongoDB query
db.products.findOne()

// Output:
{
  _id: ObjectId("..."),
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
  image: "https://example.com/image.jpg",
  stock: 100,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 9. ✅ Summary

1. **Create products** with `title`, `description`, `titleGu`, `descriptionGu`
2. **Fetch products** - language is automatically selected based on user preference
3. **Update products** - update translations as needed
4. **Migrate old products** - run migration script if needed
5. **Build forms** - include fields for both languages

The system handles everything else automatically! 🎉

