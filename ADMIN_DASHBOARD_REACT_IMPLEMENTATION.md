# 🎛️ SUPER ADMIN DASHBOARD - REACT TYPESCRIPT IMPLEMENTATION GUIDE

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Admin Sidebar Menu Structure](#admin-sidebar-menu-structure)
3. [Database Schema](#database-schema)
4. [Backend API Architecture](#backend-api-architecture)
5. [Frontend React Components](#frontend-react-components)
6. [Complete CRUD Operations](#complete-crud-operations)
7. [State Management](#state-management)
8. [File Upload System](#file-upload-system)

---

## 1. OVERVIEW

### **Super Admin Access (`group_id == 0`)**

The Super Admin dashboard is the **master control panel** for the entire My Group application. It manages:

- ✅ **Profile Management** - Group settings, created apps, group accounts
- ✅ **Content Management** - Country/State/District, Language, Education, Profession
- ✅ **Category Creation** - 8 group categories (Mymedia, Myjoy, Myshop, etc.)
- ✅ **My Ads** - Advertisement management system
- ✅ **Corporate Login** - Franchise system access

---

## 2. ADMIN SIDEBAR MENU STRUCTURE

### **A. Dashboard**
```
Route: /dashboard
Controller: Admin_controller::index()
View: admin/admin_dashboard.php
```

### **B. Profile Menu (group_id == 0)**

```typescript
interface ProfileMenu {
  title: "Profile";
  icon: "fa-cogs";
  submenus: [
    {
      name: "Group";
      route: "/admin/group";
      controller: "Admin_controller::group()";
      model: "Admin_model::group_details()";
      table: "group";
      operations: ["READ", "UPDATE"];
    },
    {
      name: "Created";
      route: "/admin/create";
      controller: "Admin_controller::create()";
      model: "Admin_model::create_group()";
      tables: ["group_create", "create_details"];
      operations: ["CREATE", "READ", "DELETE"];
    },
    {
      name: "Group Account";
      route: "/admin/user-group-creation";
      controller: "Admin_controller::user_group_creation()";
      operations: ["CREATE", "READ", "UPDATE", "DELETE"];
    },
    {
      name: "Change Password";
      route: "/admin/change-password";
      controller: "Admin_controller::change_password()";
      operations: ["UPDATE"];
    }
  ];
}
```

### **C. Content Menu (group_id == 0)**

```typescript
interface ContentMenu {
  title: "Content";
  icon: "fa-cogs";
  submenus: [
    {
      name: "Country List";
      submenus: [
        {
          name: "Continent";
          route: "/admin/continent";
          controller: "Country_controller::continent()";
          model: "Country_model::get_continet()";
          table: "continent_tbl";
          operations: ["CREATE", "READ", "UPDATE", "DELETE"];
        },
        {
          name: "Country";
          route: "/admin/country";
          controller: "Country_controller::country()";
          model: "Country_model::get_country_list()";
          table: "country_tbl";
          operations: ["CREATE", "READ", "UPDATE", "DELETE"];
        },
        {
          name: "State";
          route: "/admin/state";
          controller: "Country_controller::state()";
          model: "Country_model::get_all_state()";
          table: "state_tbl";
          operations: ["CREATE", "READ", "UPDATE", "DELETE"];
        },
        {
          name: "District";
          route: "/admin/district";
          controller: "Country_controller::district()";
          model: "Country_model::get_district_details()";
          table: "district_tbl";
          operations: ["CREATE", "READ", "UPDATE", "DELETE"];
        }
      ];
    },
    {
      name: "Language";
      route: "/admin/language";
      controller: "Admin_controller::language()";
      model: "Admin_model::get_language_details()";
      table: "language";
      operations: ["CREATE", "READ", "UPDATE", "DELETE"];
    },
    {
      name: "Education";
      route: "/admin/education";
      controller: "Admin_controller::education()";
      model: "Admin_model::get_education_details()";
      table: "education";
      operations: ["CREATE", "READ", "UPDATE", "DELETE"];
    },
    {
      name: "Profession";
      route: "/admin/profession";
      controller: "Admin_controller::profession()";
      model: "Admin_model::get_profession_details()";
      table: "profession";
      operations: ["CREATE", "READ", "UPDATE", "DELETE"];
    }
  ];
}
```

### **D. Create Category Menu (group_id == 0)**

```typescript
interface CreateCategoryMenu {
  title: "Create Category";
  icon: "fa-cogs";
  submenus: [
    { name: "My Media", route: "/admin/create-category/Mymedia" },
    { name: "My Joy", route: "/admin/create-category/Myjoy" },
    { name: "My Shop", route: "/admin/create-category/Myshop" },
    { name: "My Friend", route: "/admin/create-category/Myfriend" },
    { name: "My Unions", route: "/admin/create-category/Myunions" },
    { name: "My Biz", route: "/admin/create-category/Mybiz" },
    { name: "My TV", route: "/admin/create-category/Mytv" },
    { name: "My Needy", route: "/admin/create-category/Myneedy" }
  ];
  controller: "Admin_controller::create_category(:groupName)";
  operations: ["CREATE", "READ", "UPDATE", "DELETE"];
}
```

### **E. My Ads (group_id == 0)**

```typescript
interface MyAdsMenu {
  name: "My Ads";
  route: "/myads/admin-dashboard";
  controller: "Myads::admin_dashboard()";
  icon: "fa-cogs";
}
```

### **F. Corporate Login (group_id == 0)**

```typescript
interface CorporateLoginMenu {
  name: "Corporate Login";
  route: "/franchise/corporate-login";
  controller: "Franchise::corporate_login()";
  icon: "fa-cogs";
}
```

---

## 3. DATABASE SCHEMA

### **A. Core Tables**

#### **1. `group` Table**
```sql
CREATE TABLE `group` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `icon` VARCHAR(255),
  `logo` VARCHAR(255),
  `name_image` VARCHAR(255),
  `background_color` VARCHAR(50),
  `header_ads1` VARCHAR(255),
  `header_ads2` VARCHAR(255),
  `header_ads3` VARCHAR(255),
  `side_ads` VARCHAR(255),
  `main_ads` VARCHAR(255),
  `header_ads_url_1` VARCHAR(255),
  `header_ads_url_2` VARCHAR(255),
  `header_ads_url_3` VARCHAR(255),
  `side_ads_url` VARCHAR(255),
  `main_ads_url` VARCHAR(255),
  `side_seconds` INT(11),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose:** Main group configuration with logos, ads, and branding
**CRUD Operations:** READ, UPDATE (single row)

#### **2. `group_create` Table**
```sql
CREATE TABLE `group_create` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `apps_name` VARCHAR(255) NOT NULL COMMENT 'My Apps, My Company, My Online Apps, My Offline Apps',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Group categories and app classifications
**CRUD Operations:** CREATE, READ, DELETE

#### **3. `create_details` Table**
```sql
CREATE TABLE `create_details` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `create_id` INT(11) NOT NULL,
  `icon` VARCHAR(255),
  `logo` VARCHAR(255),
  `name_image` VARCHAR(255),
  `background_color` VARCHAR(50),
  `banner` VARCHAR(255),
  `url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`create_id`) REFERENCES `group_create`(`id`) ON DELETE CASCADE
);
```

**Purpose:** Detailed configuration for each group category
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

#### **4. `continent_tbl` Table**
```sql
CREATE TABLE `continent_tbl` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `continent_name` VARCHAR(255) NOT NULL,
  `order_wise` INT(11) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose:** Continent master data
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

#### **5. `country_tbl` Table**
```sql
CREATE TABLE `country_tbl` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `continent_id` INT(11) NOT NULL,
  `country_name` VARCHAR(255) NOT NULL,
  `country_flag` VARCHAR(255),
  `order_wise` INT(11) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`continent_id`) REFERENCES `continent_tbl`(`id`) ON DELETE CASCADE
);
```

**Purpose:** Country master data with flags
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

#### **6. `state_tbl` Table**
```sql
CREATE TABLE `state_tbl` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `continent_id` INT(11) NOT NULL,
  `country_id` INT(11) NOT NULL,
  `state_name` VARCHAR(255) NOT NULL,
  `order_wise` INT(11) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`continent_id`) REFERENCES `continent_tbl`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`country_id`) REFERENCES `country_tbl`(`id`) ON DELETE CASCADE
);
```

**Purpose:** State/Province master data
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

#### **7. `district_tbl` Table**
```sql
CREATE TABLE `district_tbl` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `continent_id` INT(11) NOT NULL,
  `country_id` INT(11) NOT NULL,
  `state_id` INT(11) NOT NULL,
  `district_name` VARCHAR(255) NOT NULL,
  `order_wise` INT(11) DEFAULT 0,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`continent_id`) REFERENCES `continent_tbl`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`country_id`) REFERENCES `country_tbl`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`state_id`) REFERENCES `state_tbl`(`id`) ON DELETE CASCADE
);
```

**Purpose:** District/City master data
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

#### **8. `language` Table**
```sql
CREATE TABLE `language` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `lang_1` VARCHAR(255) NOT NULL,
  `lang_2` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose:** Multi-language support
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

#### **9. `education` Table**
```sql
CREATE TABLE `education` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `education_name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose:** Education qualification master
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

#### **10. `profession` Table**
```sql
CREATE TABLE `profession` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `profession_name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose:** Profession/Occupation master
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

---

## 4. REACT COMPONENT STRUCTURE

### **Admin Dashboard Layout**

```
AdminDashboard/
├── Layout/
│   ├── AdminLayout.tsx
│   ├── AdminSidebar.tsx
│   ├── AdminHeader.tsx
│   └── AdminBreadcrumb.tsx
├── Profile/
│   ├── GroupSettings.tsx
│   ├── CreatedGroups.tsx
│   ├── GroupAccount.tsx
│   └── ChangePassword.tsx
├── Content/
│   ├── Country/
│   │   ├── ContinentList.tsx
│   │   ├── CountryList.tsx
│   │   ├── StateList.tsx
│   │   └── DistrictList.tsx
│   ├── LanguageList.tsx
│   ├── EducationList.tsx
│   └── ProfessionList.tsx
├── Category/
│   ├── CategoryList.tsx
│   └── CategoryForm.tsx
└── Shared/
    ├── DataTable.tsx
    ├── FileUpload.tsx
    ├── CascadingDropdown.tsx
    ├── StatusToggle.tsx
    └── DragDropList.tsx
```

---

## 5. COMPLETE CRUD OPERATIONS SUMMARY

### **A. GROUP MANAGEMENT**

#### **1. Group Settings**

| Property | Details |
|----------|---------|
| **Route** | `/admin/group` |
| **Controller** | `Admin_controller::group()` |
| **Model** | `Admin_model::get_logo_image()`, `Admin_model::insert_upload_group()` |
| **Table** | `group` |
| **Operations** | READ, UPDATE |

**Form Fields:**
- `icon_photo` - File upload (image)
- `logo_photo` - File upload (image)
- `name_photo` - File upload (image)
- `background_color` - Color picker
- `header_ads1` - File upload (image) + URL
- `header_ads2` - File upload (image) + URL
- `header_ads3` - File upload (image) + URL
- `side_ads` - File upload (image) + URL + seconds
- `main_ads` - File upload (image) + URL

**CRUD Flow:**
```
READ:  GET /api/admin/group → Returns single group configuration
UPDATE: PUT /api/admin/group → Updates group with 8 file uploads
```

---

#### **2. Created Groups**

| Property | Details |
|----------|---------|
| **Route** | `/admin/create` |
| **Controller** | `Admin_controller::create()` |
| **Model** | `Admin_model::create_group()`, `Admin_model::insert_group_associates()` |
| **Tables** | `group_create`, `create_details` |
| **Operations** | CREATE, READ, DELETE |

**Form Fields:**
- `group_name` - Text input
- `apps_name` - Select (My Apps, My Company, My Online Apps, My Offline Apps)

**CRUD Flow:**
```
CREATE: POST /api/admin/created-groups → Creates new group
READ:   GET /api/admin/created-groups → Returns all created groups with details
DELETE: DELETE /api/admin/created-groups/:id → Deletes group and details
```

---

#### **3. Group Account**

| Property | Details |
|----------|---------|
| **Route** | `/admin/user-group-creation` |
| **Controller** | `Admin_controller::user_group_creation()` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**CRUD Flow:**
```
CREATE: POST /api/admin/group-accounts → Creates user group account
READ:   GET /api/admin/group-accounts → Returns all group accounts
UPDATE: PUT /api/admin/group-accounts/:id → Updates group account
DELETE: DELETE /api/admin/group-accounts/:id → Deletes group account
```

---

#### **4. Change Password**

| Property | Details |
|----------|---------|
| **Route** | `/admin/change-password` |
| **Controller** | `Admin_controller::change_password()` |
| **Operations** | UPDATE |

**Form Fields:**
- `old_password` - Password input
- `new_password` - Password input
- `confirm_password` - Password input

**CRUD Flow:**
```
UPDATE: PUT /api/admin/change-password → Updates admin password
```

---

### **B. CONTENT MANAGEMENT**

#### **1. Continent Management**

| Property | Details |
|----------|---------|
| **Route** | `/admin/continent` |
| **Controller** | `Country_controller::continent()` |
| **Model** | `Country_model::get_continet()`, `Country_model::insert_continent()` |
| **Table** | `continent_tbl` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Form Fields:**
- `continent_name` - Text input
- `order_wise` - Number (drag-drop reordering)
- `status` - Toggle (Active/Inactive)

**CRUD Flow:**
```
CREATE: POST /api/country/continents → Creates continent
READ:   GET /api/country/continents → Returns all continents
UPDATE: PUT /api/country/continents/:id → Updates continent
DELETE: DELETE /api/country/continents/:id → Deletes continent
```

**Special Features:**
- Drag-drop reordering: `POST /api/country/update-order`
- Status toggle: `POST /api/country/update-status`

---

#### **2. Country Management**

| Property | Details |
|----------|---------|
| **Route** | `/admin/country` |
| **Controller** | `Country_controller::country()` |
| **Model** | `Country_model::get_country_list()`, `Country_model::insert_country()` |
| **Table** | `country_tbl` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Form Fields:**
- `continent_id` - Select dropdown (cascading)
- `country_name` - Text input
- `country_flag` - File upload (image)
- `order_wise` - Number
- `status` - Toggle

**CRUD Flow:**
```
CREATE: POST /api/country/countries → Creates country with flag upload
READ:   GET /api/country/countries → Returns all countries
        GET /api/country/countries?continentId=1 → Filter by continent
UPDATE: PUT /api/country/countries/:id → Updates country
DELETE: DELETE /api/country/countries/:id → Deletes country
```

**Cascading Dropdown:**
```
GET /api/country/countries-by-continent/:continentId → Returns countries for continent
```

---

#### **3. State Management**

| Property | Details |
|----------|---------|
| **Route** | `/admin/state` |
| **Controller** | `Country_controller::state()` |
| **Model** | `Country_model::get_all_state()`, `Country_model::insert_state()` |
| **Table** | `state_tbl` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Form Fields:**
- `continent_id` - Select dropdown
- `country_id` - Select dropdown (cascading)
- `state_name` - Text input
- `order_wise` - Number
- `status` - Toggle

**CRUD Flow:**
```
CREATE: POST /api/country/states → Creates state
READ:   GET /api/country/states → Returns all states
        GET /api/country/states?countryId=1 → Filter by country
UPDATE: PUT /api/country/states/:id → Updates state
DELETE: DELETE /api/country/states/:id → Deletes state
```

**Cascading Dropdown:**
```
GET /api/country/states-by-country/:countryId → Returns states for country
```

---

#### **4. District Management**

| Property | Details |
|----------|---------|
| **Route** | `/admin/district` |
| **Controller** | `Country_controller::district()` |
| **Model** | `Country_model::get_district_details()`, `Country_model::insert_district()` |
| **Table** | `district_tbl` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Form Fields:**
- `continent_id` - Select dropdown
- `country_id` - Select dropdown (cascading)
- `state_id` - Select dropdown (cascading)
- `district_name` - Text input
- `order_wise` - Number
- `status` - Toggle

**CRUD Flow:**
```
CREATE: POST /api/country/districts → Creates district
READ:   GET /api/country/districts → Returns all districts
        GET /api/country/districts?stateId=1 → Filter by state
UPDATE: PUT /api/country/districts/:id → Updates district
DELETE: DELETE /api/country/districts/:id → Deletes district
```

**Cascading Dropdown:**
```
GET /api/country/districts-by-state/:stateId → Returns districts for state
```

---

#### **5. Language Management**

| Property | Details |
|----------|---------|
| **Route** | `/admin/language` |
| **Controller** | `Admin_controller::language()` |
| **Model** | `Admin_model::get_language_details()`, `Admin_model::insert_langague_details()` |
| **Table** | `language` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Form Fields:**
- `lang_1` - Text input (Primary language)
- `lang_2` - Text input (Secondary language - optional)

**CRUD Flow:**
```
CREATE: POST /api/content/languages → Creates language
READ:   GET /api/content/languages → Returns all languages
        GET /api/content/languages/:id → Returns single language
UPDATE: PUT /api/content/languages/:id → Updates language
DELETE: DELETE /api/content/languages/:id → Deletes language
```

**View Pattern:**
- Single form for both CREATE and UPDATE
- Table listing with Edit/Delete actions
- Edit loads data into form above table

---

#### **6. Education Management**

| Property | Details |
|----------|---------|
| **Route** | `/admin/education` |
| **Controller** | `Admin_controller::education()` |
| **Model** | `Admin_model::get_education_details()`, `Admin_model::insert_education_details()` |
| **Table** | `education` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Form Fields:**
- `education_name` - Text input

**CRUD Flow:**
```
CREATE: POST /api/content/education → Creates education
READ:   GET /api/content/education → Returns all education records
        GET /api/content/education/:id → Returns single education
UPDATE: PUT /api/content/education/:id → Updates education
DELETE: DELETE /api/content/education/:id → Deletes education
```

---

#### **7. Profession Management**

| Property | Details |
|----------|---------|
| **Route** | `/admin/profession` |
| **Controller** | `Admin_controller::profession()` |
| **Model** | `Admin_model::get_profession_details()`, `Admin_model::insert_profession_details()` |
| **Table** | `profession` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Form Fields:**
- `profession_name` - Text input

**CRUD Flow:**
```
CREATE: POST /api/content/profession → Creates profession
READ:   GET /api/content/profession → Returns all professions
        GET /api/content/profession/:id → Returns single profession
UPDATE: PUT /api/content/profession/:id → Updates profession
DELETE: DELETE /api/content/profession/:id → Deletes profession
```

---

### **C. CREATE CATEGORY MANAGEMENT**

#### **Category Creation (8 Categories)**

| Property | Details |
|----------|---------|
| **Routes** | `/admin/create-category/Mymedia`, `/admin/create-category/Myjoy`, etc. |
| **Controller** | `Admin_controller::create_category(:groupName)` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

**Categories:**
1. **My Media** - Media content categories
2. **My Joy** - Entertainment categories
3. **My Shop** - E-commerce categories
4. **My Friend** - Social networking categories
5. **My Unions** - Union/Organization categories
6. **My Biz** - Business categories
7. **My TV** - Video streaming categories
8. **My Needy** - Service request categories

**CRUD Flow:**
```
CREATE: POST /api/admin/categories → Creates category for specific group
READ:   GET /api/admin/categories/:groupName → Returns categories for group
UPDATE: PUT /api/admin/categories/:id → Updates category
DELETE: DELETE /api/admin/categories/:id → Deletes category
```

---

### **D. MY ADS MANAGEMENT**

| Property | Details |
|----------|---------|
| **Route** | `/myads/admin-dashboard` |
| **Controller** | `Myads::admin_dashboard()` |
| **Operations** | Full advertisement management system |

**Features:**
- Advertisement creation and management
- Product categories
- Product listings
- Gallery management
- About us page management
- Contact us management

---

### **E. CORPORATE LOGIN**

| Property | Details |
|----------|---------|
| **Route** | `/franchise/corporate-login` |
| **Controller** | `Franchise::corporate_login()` |
| **Operations** | Franchise system access |

---

## 6. COMPLETE TABLE REFERENCE

### **Tables Used in Super Admin Dashboard**

| # | Table Name | Purpose | CRUD Operations |
|---|------------|---------|-----------------|
| 1 | `group` | Main group configuration | READ, UPDATE |
| 2 | `group_create` | Created groups list | CREATE, READ, DELETE |
| 3 | `create_details` | Group details with images | CREATE, READ, UPDATE, DELETE |
| 4 | `continent_tbl` | Continent master | CREATE, READ, UPDATE, DELETE |
| 5 | `country_tbl` | Country master with flags | CREATE, READ, UPDATE, DELETE |
| 6 | `state_tbl` | State/Province master | CREATE, READ, UPDATE, DELETE |
| 7 | `district_tbl` | District/City master | CREATE, READ, UPDATE, DELETE |
| 8 | `language` | Language master | CREATE, READ, UPDATE, DELETE |
| 9 | `education` | Education qualification master | CREATE, READ, UPDATE, DELETE |
| 10 | `profession` | Profession/Occupation master | CREATE, READ, UPDATE, DELETE |

---

## 7. REACT COMPONENT STRUCTURE

### **Admin Dashboard Layout**

```
AdminDashboard/
├── Layout/
│   ├── AdminLayout.tsx
│   ├── AdminSidebar.tsx
│   ├── AdminHeader.tsx
│   └── AdminBreadcrumb.tsx
├── Profile/
│   ├── GroupSettings.tsx
│   ├── CreatedGroups.tsx
│   ├── GroupAccount.tsx
│   └── ChangePassword.tsx
├── Content/
│   ├── Country/
│   │   ├── ContinentList.tsx
│   │   ├── CountryList.tsx
│   │   ├── StateList.tsx
│   │   └── DistrictList.tsx
│   ├── LanguageList.tsx
│   ├── EducationList.tsx
│   └── ProfessionList.tsx
├── Category/
│   ├── CategoryList.tsx
│   └── CategoryForm.tsx
└── Shared/
    ├── DataTable.tsx
    ├── FileUpload.tsx
    ├── CascadingDropdown.tsx
    ├── StatusToggle.tsx
    └── DragDropList.tsx
```

---

## 8. API ENDPOINTS SUMMARY

### **Admin Profile APIs**

```typescript
// Group Settings
GET    /api/admin/group
PUT    /api/admin/group

// Created Groups
GET    /api/admin/created-groups
POST   /api/admin/created-groups
DELETE /api/admin/created-groups/:id

// Group Account
GET    /api/admin/group-accounts
POST   /api/admin/group-accounts
PUT    /api/admin/group-accounts/:id
DELETE /api/admin/group-accounts/:id

// Change Password
PUT    /api/admin/change-password
```

### **Country Management APIs**

```typescript
// Continent
GET    /api/country/continents
POST   /api/country/continents
PUT    /api/country/continents/:id
DELETE /api/country/continents/:id

// Country
GET    /api/country/countries
GET    /api/country/countries?continentId=:id
POST   /api/country/countries
PUT    /api/country/countries/:id
DELETE /api/country/countries/:id

// State
GET    /api/country/states
GET    /api/country/states?countryId=:id
POST   /api/country/states
PUT    /api/country/states/:id
DELETE /api/country/states/:id

// District
GET    /api/country/districts
GET    /api/country/districts?stateId=:id
POST   /api/country/districts
PUT    /api/country/districts/:id
DELETE /api/country/districts/:id

// Cascading Dropdowns
GET    /api/country/countries-by-continent/:continentId
GET    /api/country/states-by-country/:countryId
GET    /api/country/districts-by-state/:stateId

// Order & Status
POST   /api/country/update-order
POST   /api/country/update-status
```

### **Content Management APIs**

```typescript
// Language
GET    /api/content/languages
GET    /api/content/languages/:id
POST   /api/content/languages
PUT    /api/content/languages/:id
DELETE /api/content/languages/:id

// Education
GET    /api/content/education
GET    /api/content/education/:id
POST   /api/content/education
PUT    /api/content/education/:id
DELETE /api/content/education/:id

// Profession
GET    /api/content/profession
GET    /api/content/profession/:id
POST   /api/content/profession
PUT    /api/content/profession/:id
DELETE /api/content/profession/:id
```

### **Category Management APIs**

```typescript
// Categories
GET    /api/admin/categories/:groupName
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

---

## 9. SUMMARY

### **Super Admin Dashboard Overview**

| Category | Menu Items | Total Tables | Total APIs |
|----------|------------|--------------|------------|
| **Profile** | 4 | 3 | 12 |
| **Content** | 7 | 7 | 35 |
| **Create Category** | 8 | - | 4 |
| **My Ads** | 1 | - | - |
| **Corporate Login** | 1 | - | - |
| **TOTAL** | **21** | **10** | **51+** |

### **CRUD Operations Summary**

| Operation | Count | Percentage |
|-----------|-------|------------|
| CREATE | 10 | 100% |
| READ | 10 | 100% |
| UPDATE | 10 | 100% |
| DELETE | 10 | 100% |

### **Special Features**

✅ **Multi-File Upload** - Group settings with 8 file uploads
✅ **Cascading Dropdowns** - Continent → Country → State → District
✅ **Drag-Drop Reordering** - Order management for all master data
✅ **Status Toggle** - Active/Inactive status management
✅ **Image Upload** - Country flags and group images
✅ **Color Picker** - Background color selection
✅ **Inline Editing** - Edit form above data table
✅ **Confirmation Dialogs** - Delete confirmations
✅ **Flash Messages** - Success/Error feedback

---

## 10. MIGRATION CHECKLIST

### **Phase 1: Database Setup**
- [ ] Create all 10 tables with proper indexes
- [ ] Set up foreign key relationships
- [ ] Add sample data for testing

### **Phase 2: Backend Development**
- [ ] Set up Node.js + Express + TypeScript
- [ ] Create Sequelize models (10 models)
- [ ] Implement all API endpoints (51+ endpoints)
- [ ] Add authentication middleware
- [ ] Add role-based access control (group_id === 0)
- [ ] Set up file upload with Multer + S3
- [ ] Add validation with Zod

### **Phase 3: Frontend Development**
- [ ] Set up React + TypeScript + Vite
- [ ] Create admin layout components
- [ ] Implement all CRUD pages (10 pages)
- [ ] Add file upload components
- [ ] Add cascading dropdown components
- [ ] Add drag-drop reordering
- [ ] Add status toggle switches
- [ ] Implement React Query for data fetching
- [ ] Add Redux Toolkit for state management

### **Phase 4: Testing**
- [ ] Unit tests for all API endpoints
- [ ] Integration tests for CRUD operations
- [ ] E2E tests for critical flows
- [ ] File upload testing
- [ ] Cascading dropdown testing

### **Phase 5: Deployment**
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Production deployment
- [ ] Monitoring and logging

---

**END OF DOCUMENT**





