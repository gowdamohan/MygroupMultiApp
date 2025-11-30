# 🏢 CORPORATE LOGIN DASHBOARD - REACT TYPESCRIPT IMPLEMENTATION

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Complete Menu Structure from Sidebar](#complete-menu-structure-from-sidebar)
3. [Database Tables Reference](#database-tables-reference)
4. [Query Structure & Model Methods](#query-structure--model-methods)
5. [Complete CRUD Operations](#complete-crud-operations)
6. [API Endpoints Summary](#api-endpoints-summary)
7. [React Component Structure](#react-component-structure)

---

## 1. OVERVIEW

### **Corporate Login Access (`group_id == 5`, Role: `corporate`)**

The Corporate Login dashboard is the **franchise head office control panel** for managing franchise operations across the My Group application.

**Access Control:**
- **User Group:** `corporate` (group_id = 5)
- **Sidebar File:** `application/views/admin/franchise_head_sidebar.php`
- **Dashboard Route:** `/dashboard` → `Admin_controller::_franchise_head_dashboard()`
- **View Template:** `admin/inc/template_head_franchise.php`
- **Dashboard View:** `admin/corporate_dashboard.php`

**Key Features:**
- ✅ **Head Office Login Management** - Create and manage head office users by country
- ✅ **Advertisement Management** - Header ads, popup ads, company header ads, main page ads
- ✅ **Profile Management** - Corporate profile settings
- ✅ **Application Details** - View application information
- ✅ **Terms & Conditions** - Manage franchise terms
- ✅ **Footer Content** - About Us, Awards, Newsroom, Events, Gallery, etc.
- ✅ **Database Access** - Public and client databases
- ✅ **Applications** - Franchise, Job, Enquiry forms
- ✅ **Support** - Feedback, Chat support
- ✅ **Change Password** - Password management

---

## 2. COMPLETE MENU STRUCTURE FROM SIDEBAR

### **� MENU SUMMARY TABLE**

| # | Menu Label | Route | Controller | Tables Used | Operations |
|---|------------|-------|------------|-------------|------------|
| 1 | Dashboard | `/dashboard` | `Admin_controller::_franchise_head_dashboard()` | `users`, `users_groups`, `franchise_holder`, `franchise_advertise` | READ |
| 2 | Head Office Login | `/franchise/create_head_office_login` | `Franchise::create_head_office_login()` | `users`, `users_groups`, `franchise_holder`, `country_tbl`, `continent_tbl` | CREATE, READ, UPDATE, RESET, TOGGLE |
| 3 | Header Ads | `/franchise/corporate_header_ads` | `Franchise::corporate_header_ads()` | `franchise_advertise`, `group_create`, `create_details`, `franchise_holder` | CREATE, READ, UPDATE |
| 4 | Popup Add | `/franchise/popup_add` | `Franchise::popup_add()` | `popup_ads` | CREATE, READ, UPDATE |
| 5 | My Company Header Ads | `/franchise/my_company_header_ads` | `Franchise::my_company_header_ads()` | `advertise` | CREATE, READ, UPDATE |
| 6 | Main Page Ads | `/franchise/main_page_ads` | `Franchise::main_page_ads()` | `main_page_ads` | CREATE, READ, UPDATE |
| 7 | Profile | `/admin/profile` | - | `users` | READ, UPDATE |
| 8 | Application Details | `/admin_controller/application_details` | `Admin_controller::application_details()` | - | READ |
| 9 | Terms and Conditions | `/franchise/terms_conditions` | `Franchise::terms_conditions()` | `franchise_terms_conditions` | CREATE, READ, UPDATE |
| 10.1 | Footer → About Us | `/admin_controller/about_us` | `Admin_controller::about_us()` | `about` | CREATE, READ, UPDATE, DELETE |
| 10.2 | Footer → Awards | `/admin_controller/footer_same_page/awards` | `Admin_controller::footer_same_page('awards')` | `awards` | CREATE, READ, UPDATE, DELETE |
| 10.3 | Footer → Newsroom | `/admin_controller/footer_same_page/newsroom` | `Admin_controller::footer_same_page('newsroom')` | `newsroom` | CREATE, READ, UPDATE, DELETE |
| 10.4 | Footer → Events | `/admin_controller/footer_same_page/events` | `Admin_controller::footer_same_page('events')` | `events` | CREATE, READ, UPDATE, DELETE |
| 10.5 | Footer → Careers | `/admin_controller/footer_same_page/careers` | `Admin_controller::footer_same_page('careers')` | `careers` | CREATE, READ, UPDATE, DELETE |
| 10.6 | Footer → Clients | `/admin_controller/footer_same_page/clients` | `Admin_controller::footer_same_page('clients')` | `clients` | CREATE, READ, UPDATE, DELETE |
| 10.7 | Footer → Milestones | `/admin_controller/footer_same_page/milestones` | `Admin_controller::footer_same_page('milestones')` | `milestones` | CREATE, READ, UPDATE, DELETE |
| 10.8 | Footer → Testimonials | `/admin_controller/footer_same_page/testimonials` | `Admin_controller::footer_same_page('testimonials')` | `testimonials` | CREATE, READ, UPDATE, DELETE |
| 10.9 | Footer → Gallery | `/admin_controller/gallery` | `Admin_controller::gallery()` | `gallery` | CREATE, READ, UPDATE, DELETE |
| 10.10 | Footer → Contact Us | `/admin_controller/contact_us` | `Admin_controller::contact_us()` | `contact_us` | CREATE, READ, UPDATE |
| 10.11 | Footer → Social Media Link | `/admin_controller/social_link` | `Admin_controller::social_link()` | `social_link` | CREATE, READ, UPDATE, DELETE |
| 10.12 | Footer → Terms And Conditions | `/admin_controller/tnc` | `Admin_controller::tnc()` | `tnc_details` | CREATE, READ, UPDATE |
| 10.13 | Footer → Privacy and Policy | `/admin_controller/pnp` | `Admin_controller::pnp()` | `privacy_policy` | CREATE, READ, UPDATE |
| 10.14 | Footer → Instructions | `#` | - | - | - |
| 11 | Public Database | `/admin_controller/public_database` | `Admin_controller::public_database()` | `users`, `user_registration_form`, `country_tbl`, `state_tbl`, `district_tbl` | READ |
| 12 | Client Database | `#` | - | - | READ |
| 13 | Franchise Application | `/admin_controller/franchise_application` | `Admin_controller::franchise_application()` | `apply_franchise_now`, `country_tbl`, `state_tbl`, `district_tbl` | READ |
| 14 | Job Application | `/admin_controller/job_application` | `Admin_controller::job_application()` | `apply_job_now`, `country_tbl` | READ |
| 15 | Enquiry Form | `/admin_controller/enquiry_form` | `Admin_controller::enquiry_form()` | `enquiry_form` | READ |
| 16 | Technical Support | `#` | - | - | - |
| 17.1 | Supports → Feedback and Suggestions | `/admin_controller/feed_back_suggetion` | `Admin_controller::feed_back_suggetion()` | `feedback_suggetions` | READ |
| 17.2 | Supports → Chat with Us | `/admin_controller/feed_back_users` | `Admin_controller::feed_back_users()` | `feedback_suggetions_users` | READ, CREATE |
| 18 | Change Password | `/admin_controller/change_password_head_dashboard` | `Admin_controller::change_password_head_dashboard()` | `users` | UPDATE |
| 19 | Logout | `#` (mb-signout) | - | - | - |

**Total Menu Items:** 19 main items + 14 footer subitems + 2 support subitems = **35 menu items**

---

### **🗂️ DATABASE TABLES SUMMARY**

| # | Table Name | Purpose | Used By Menu Items |
|---|------------|---------|-------------------|
| 1 | `users` | User authentication and profiles | 1, 2, 7, 11, 18 |
| 2 | `users_groups` | User role assignments | 1, 2 |
| 3 | `franchise_holder` | Franchise location mapping | 1, 2, 3 |
| 4 | `franchise_advertise` | Corporate header ads | 1, 3 |
| 5 | `group_create` | App categories | 3 |
| 6 | `create_details` | App details (icons, URLs) | 3 |
| 7 | `country_tbl` | Country master data | 2, 11, 13, 14 |
| 8 | `continent_tbl` | Continent master data | 2 |
| 9 | `state_tbl` | State master data | 11, 13 |
| 10 | `district_tbl` | District master data | 11, 13 |
| 11 | `popup_ads` | Popup advertisements | 4 |
| 12 | `advertise` | Company header ads | 5 |
| 13 | `main_page_ads` | Main page ads (3 slots) | 6 |
| 14 | `franchise_terms_conditions` | Franchise T&C content | 9 |
| 15 | `about` | About Us content | 10.1 |
| 16 | `awards` | Awards content | 10.2 |
| 17 | `newsroom` | Newsroom content | 10.3 |
| 18 | `events` | Events content | 10.4 |
| 19 | `careers` | Careers/Jobs content | 10.5 |
| 20 | `clients` | Client logos/testimonials | 10.6 |
| 21 | `milestones` | Milestones content | 10.7 |
| 22 | `testimonials` | Testimonials content | 10.8 |
| 23 | `gallery` | Gallery images | 10.9 |
| 24 | `contact_us` | Contact information | 10.10 |
| 25 | `social_link` | Social media links | 10.11 |
| 26 | `tnc_details` | Terms and conditions | 10.12 |
| 27 | `privacy_policy` | Privacy policy content | 10.13 |
| 28 | `user_registration_form` | User registration data | 11 |
| 29 | `apply_franchise_now` | Franchise applications | 13 |
| 30 | `apply_job_now` | Job applications | 14 |
| 31 | `enquiry_form` | Enquiry submissions | 15 |
| 32 | `feedback_suggetions` | Feedback data | 17.1 |
| 33 | `feedback_suggetions_users` | Chat/feedback users | 17.2 |

**Total Tables:** 33 tables

---

### **🔍 KEY QUERY STRUCTURES**

#### **1. Get Franchise Holder Details**
```sql
-- Model: Franchise_model::get_franhise_holder($group_id)
SELECT u.*, country, state, district
FROM users_groups ug
JOIN users u ON ug.user_id = u.id
JOIN franchise_holder fh ON u.id = fh.user_id
WHERE ug.group_id = ?;
```

#### **2. Get Country List with Continent**
```sql
-- Model: Country_model::get_country_list()
SELECT cn.continent, co.country, co.id, co.order, co.status, co.code,
       co.currency, co.phone_code, co.nationality
FROM country_tbl co
JOIN continent_tbl cn ON co.continent_id = cn.id;
```

#### **3. Get All Apps with Subcategories**
```sql
-- Model: Franchise_model::get_all_my_aps_sub()
SELECT gc.id, gc.apps_name, gc.name, cd.icon, cd.url
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Apps'
ORDER BY gc.id;
```

#### **4. Get Franchise Advertise Data**
```sql
-- Model: Franchise_model::get_ads_uploaded_data_corporate()
SELECT fh.id as franchise_holder_id
FROM franchise_holder fh
WHERE fh.user_id = ?;

SELECT *
FROM franchise_advertise
WHERE franchise_holder_id = ?;
```

#### **5. Get Public Database**
```sql
-- Model: Admin_model::get_public_database()
SELECT u.email, u.id as userId, u.phone, u.first_name, u.display_name,
       ct.country as country_name, st.state as state_name, dt.district as district_name,
       urf.*
FROM users u
JOIN user_registration_form urf ON u.id = urf.user_id
JOIN country_tbl ct ON urf.country = ct.id
JOIN state_tbl st ON urf.state = st.id
JOIN district_tbl dt ON urf.district = dt.id;
```

#### **6. Get Franchise Applications**
```sql
-- Model: Admin_model::get_franchise_database()
SELECT ct.country as country_name, st.state as state_name, dt.district as district_name, afn.*
FROM apply_franchise_now afn
JOIN country_tbl ct ON afn.franchise_country = ct.id
JOIN state_tbl st ON afn.franchise_state = st.id
JOIN district_tbl dt ON afn.franchise_district = dt.id
ORDER BY afn.id DESC;
```

#### **7. Get Job Applications**
```sql
-- Model: Admin_model::get_job_database()
SELECT ct.country as country_name, ajn.*
FROM apply_job_now ajn
JOIN country_tbl ct ON ajn.franchise_country = ct.id
ORDER BY ajn.id DESC;
```

#### **8. Save Franchise Login**
```sql
-- Model: Franchise_model::save_franchise_login_details()
INSERT INTO franchise_holder (country, state, district, user_id)
VALUES (?, ?, ?, ?);
```

#### **9. Upload Franchise Advertise**
```sql
-- Model: Franchise_model::upload_franchise_details()
-- Check if exists
SELECT * FROM franchise_advertise
WHERE franchise_holder_id = ?
  AND my_app_name = ?
  AND my_app_sub_name = ?;

-- Insert or Update
INSERT INTO franchise_advertise
(franchise_holder_id, my_app_name, my_app_sub_name, image_path, image_url)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
image_path = VALUES(image_path),
image_url = VALUES(image_url);
```

#### **10. Franchise Terms & Conditions**
```sql
-- Model: Franchise_model::franchise_terms_conditions()
SELECT * FROM franchise_terms_conditions;

-- Insert
INSERT INTO franchise_terms_conditions (content) VALUES (?);

-- Update
UPDATE franchise_terms_conditions SET content = ? WHERE id = ?;
```

---

### **DETAILED MENU ITEMS**

### **�📌 MENU ITEM 1: Dashboard**

| Property | Details |
|----------|---------|
| **Menu Label** | Dashboard |
| **Icon** | `fa fa-desktop` |
| **Route** | `/dashboard` |
| **Controller** | `Admin_controller::_franchise_head_dashboard()` |
| **View** | `admin/corporate_dashboard.php` |
| **Template** | `admin/inc/template_head_franchise.php` |
| **Tables Used** | `users`, `users_groups`, `franchise_holder`, `franchise_advertise` |

**Dashboard Widgets:**
- Clock widget (current time/date)
- **Head Office users count** - Count of users with group_id = 6
- **Regional Office users count** - Count of users with group_id = 7
- **Branch Office users count** - Count of users with group_id = 8
- **Head Office Ads statistics** - Ads data for head office
- **Regional Office Ads statistics** - Ads data for regional office
- **Branch Office Ads statistics** - Ads data for branch office

**Query Structure:**
```sql
-- Get user counts by group_id
SELECT COUNT(*) FROM users_groups WHERE group_id = 6; -- Head Office
SELECT COUNT(*) FROM users_groups WHERE group_id = 7; -- Regional
SELECT COUNT(*) FROM users_groups WHERE group_id = 8; -- Branch
```

---

### **📌 MENU ITEM 2: Head Office Login**

| Property | Details |
|----------|---------|
| **Menu Label** | Head Office Login |
| **Icon** | `fa fa-desktop` |
| **Route** | `/franchise/create_head_office_login` |
| **Controller** | `Franchise::create_head_office_login()` |
| **Model Methods** | `Franchise_model::get_franhise_holder(6)`, `Country_model::get_country_list()` |
| **View** | `admin/franchise/head_office_login.php` |
| **Tables Used** | `users`, `users_groups`, `franchise_holder`, `country_tbl`, `continent_tbl` |
| **Operations** | CREATE, READ, UPDATE, RESET PASSWORD, TOGGLE STATUS |

**Form Fields:**
- `franchise_name` - Text input (First name)
- `franchise_email_id` - Email input
- `franchise_mobile_number` - Phone input
- `username` - Auto-generated (`my_{country_name}`)
- `password` - Default: `123456`
- `franchise_country` - Country ID (from country list)
- `group_id` - Fixed: `6` (Head Office)

**Query Structure:**
```sql
-- Get all head office users with location
SELECT u.*, country, state, district
FROM users_groups ug
JOIN users u ON ug.user_id = u.id
JOIN franchise_holder fh ON u.id = fh.user_id
WHERE ug.group_id = 6;

-- Get country list
SELECT cn.continent, co.country, co.id, co.order, co.status, co.code,
       co.currency, co.phone_code, co.nationality
FROM country_tbl co
JOIN continent_tbl cn ON co.continent_id = cn.id;

-- Save franchise holder
INSERT INTO franchise_holder (country, state, district, user_id)
VALUES (?, 0, 0, ?);
```

**CRUD Flow:**
```
CREATE: POST /api/franchise/head-office-login → Creates head office user
READ:   GET /api/franchise/head-office-login → Returns all head office users by country
UPDATE: PUT /api/franchise/head-office-login/:id → Updates head office user
RESET:  POST /api/franchise/reset-password/:userId → Resets password to 123456
TOGGLE: PUT /api/franchise/user-status/:userId → Active/Inactive toggle
```

**Special Features:**
- ✅ Auto-generates username: `my_{country_name}`
- ✅ Sends email with login credentials via CURL API
- ✅ One head office per country
- ✅ Status toggle (Active/Inactive)
- ✅ Password reset to default `123456`

---

### **📌 MENU ITEM 3: Header Ads**

| Property | Details |
|----------|---------|
| **Menu Label** | Header Ads |
| **Icon** | `fa fa-desktop` |
| **Route** | `/franchise/corporate_header_ads` |
| **Controller** | `Franchise::corporate_header_ads()` |
| **Model Methods** | `Franchise_model::get_all_my_aps_sub()`, `Franchise_model::get_ads_uploaded_data_corporate()`, `Franchise_model::get_franchies_holder_details()` |
| **View** | `admin/franchise/corporate_header_ads.php` |
| **Tables Used** | `franchise_advertise`, `group_create`, `create_details`, `franchise_holder` |
| **Operations** | CREATE, READ, UPDATE |

**Ad Categories (11 Apps with 6 Subcategories Each):**

| # | App Name | Subcategories |
|---|----------|---------------|
| 1 | **Mychat** | Mychat |
| 2 | **Mydiary** | Qk Note, Day Plan, My Docs, Quotes, Accounts, Home |
| 3 | **Mymedia** | Tv, Radio, E Paper, Magazine, Web, Youtube |
| 4 | **Myjoy** | Myvideo, Myaudio, Mybooks, Mypage, Mytok, Mygames |
| 5 | **Mybank** | Mypay, Mybank, Mycard, Myloans, Insurance, Myinvest |
| 6 | **Myshop** | Shop, Local, Resale, Brands, Wholesale, Ecoshop |
| 7 | **Myfriend** | Myfriend, Mymarry, Myjobs, Health, Travel, Booking |
| 8 | **Myunions** | News, Unions, Federation, IDs, Notice, Me |
| 9 | **Mybiz** | Production, Finance, Advertise, Franchises, Trading, Services |
| 10 | **Mytv** | Mytv, Myradio, Mypaper, Reporter, Gallery, Public |
| 11 | **Myneedy** | Doorstep, Centers, Manpower, Online, Myhelp, Myorders |

**Total Ad Slots:** 11 apps × 6 subcategories = **66 ad slots**

**Form Fields:**
- `my_app_name` - Select (11 app categories)
- `my_app_sub_name` - Select (6 subcategories per app)
- `image_name` - File upload (image)
- `image_url` - Text input (redirect URL)
- `franchise_holder_id` - Hidden (current user's franchise ID)

**Query Structure:**
```sql
-- Get all apps with subcategories
SELECT gc.id, gc.apps_name, gc.name, cd.icon, cd.url
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Apps'
ORDER BY gc.id;

-- Get franchise holder ID
SELECT fh.id as franchise_holder_id
FROM franchise_holder fh
WHERE fh.user_id = ?;

-- Get uploaded ads
SELECT *
FROM franchise_advertise
WHERE franchise_holder_id = ?;

-- Upload/Update ad
INSERT INTO franchise_advertise
(franchise_holder_id, my_app_name, my_app_sub_name, image_path, image_url)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
image_path = VALUES(image_path),
image_url = VALUES(image_url);
```

**CRUD Flow:**
```
CREATE: POST /api/franchise/header-ads → Uploads ad image
READ:   GET /api/franchise/header-ads → Returns all ads for corporate user
UPDATE: PUT /api/franchise/header-ads/:id → Updates ad image/URL
DELETE: DELETE /api/franchise/header-ads/:id → Deletes ad
```

---

### **📌 MENU ITEM 4: Popup Add**

| Property | Details |
|----------|---------|
| **Menu Label** | Popup Add |
| **Icon** | `fa fa-caret-right` |
| **Route** | `/franchise/popup_add` |
| **Controller** | `Franchise::popup_add()` |
| **Model Methods** | `Admin_model::get_popu_ads()` |
| **View** | `admin/pages/popup_ads.php` |
| **Tables Used** | `popup_ads` |
| **Operations** | CREATE, READ, UPDATE |

**Form Fields:**
- `side_ads` - File upload (popup image)

**Query Structure:**
```sql
-- Get popup ads
SELECT * FROM popup_ads;

-- Insert/Update popup ad
INSERT INTO popup_ads (side_ads) VALUES (?)
ON DUPLICATE KEY UPDATE side_ads = VALUES(side_ads);
```

**CRUD Flow:**
```
CREATE: POST /api/franchise/popup-ads → Creates popup ad
READ:   GET /api/franchise/popup-ads → Returns all popup ads
UPDATE: PUT /api/franchise/popup-ads/:id → Updates popup ad
```

---

### **📌 MENU ITEM 5: My Company Header Ads**

| Property | Details |
|----------|---------|
| **Menu Label** | My Company Header Ads |
| **Icon** | `fa fa-caret-right` |
| **Route** | `/franchise/my_company_header_ads` |
| **Controller** | `Franchise::my_company_header_ads()` |
| **Model Methods** | `Admin_model::advertise_group()` |
| **View** | `admin/pages/advertise.php` |
| **Tables Used** | `advertise` |
| **Operations** | CREATE, READ, UPDATE |

**Form Fields:**
- `advertise_image` - File upload (company header ad image)
- `advertise_url` - Text input (redirect URL)

**Query Structure:**
```sql
-- Get company header ads for group
SELECT * FROM advertise WHERE group_id = ?;
```

**CRUD Flow:**
```
CREATE: POST /api/franchise/company-header-ads → Creates company header ad
READ:   GET /api/franchise/company-header-ads → Returns company header ads
UPDATE: PUT /api/franchise/company-header-ads/:id → Updates company header ad
```

---

### **📌 MENU ITEM 6: Main Page Ads**

| Property | Details |
|----------|---------|
| **Menu Label** | Main Page Ads |
| **Icon** | `fa fa-caret-right` |
| **Route** | `/franchise/main_page_ads` |
| **Controller** | `Franchise::main_page_ads()` |
| **Model Methods** | `Admin_model::main_ads_group()` |
| **View** | `admin/pages/main_page_advertise.php` |
| **Tables Used** | `main_page_ads` |
| **Operations** | CREATE, READ, UPDATE |

**Form Fields:**
- `ads1` - File upload (main page ad 1)
- `ads2` - File upload (main page ad 2)
- `ads3` - File upload (main page ad 3)

**Query Structure:**
```sql
-- Get main page ads for group
SELECT * FROM main_page_ads WHERE group_id = ?;
```

**CRUD Flow:**
```
CREATE: POST /api/franchise/main-page-ads → Creates main page ads (3 images)
READ:   GET /api/franchise/main-page-ads → Returns main page ads
UPDATE: PUT /api/franchise/main-page-ads/:id → Updates main page ads
```

---

### **📌 MENU ITEM 7: Profile**

| Property | Details |
|----------|---------|
| **Menu Label** | Profile |
| **Icon** | `fa fa-desktop` |
| **Route** | `/admin/profile` |
| **Operations** | READ, UPDATE |

---

### **📌 MENU ITEM 8: Application Details**

| Property | Details |
|----------|---------|
| **Menu Label** | Application details |
| **Icon** | `fa fa-desktop` |
| **Route** | `/admin_controller/application_details` |
| **Controller** | `Admin_controller::application_details()` |
| **Operations** | READ |

---

### **📌 MENU ITEM 9: Terms and Conditions**

| Property | Details |
|----------|---------|
| **Menu Label** | Terms and Conditions |
| **Icon** | `fa fa-desktop` |
| **Route** | `/franchise/terms_conditions` |
| **Controller** | `Franchise::terms_conditions()` |
| **Model Methods** | `Franchise_model::franchise_terms_conditions()` |
| **View** | `admin/franchise/terms_conditions.php` |
| **Tables Used** | `franchise_terms_conditions` |
| **Operations** | CREATE, READ, UPDATE |

**Form Fields:**
- `franchise_content` - Rich text editor (HTML content)

**Query Structure:**
```sql
-- Get franchise terms
SELECT * FROM franchise_terms_conditions;

-- Insert terms
INSERT INTO franchise_terms_conditions (content) VALUES (?);

-- Update terms
UPDATE franchise_terms_conditions SET content = ? WHERE id = ?;
```

**CRUD Flow:**
```
CREATE: POST /api/franchise/terms-conditions → Creates terms content
READ:   GET /api/franchise/terms-conditions → Returns terms content
UPDATE: PUT /api/franchise/terms-conditions/:id → Updates terms content
```

---

### **📌 MENU ITEM 10: Footer (Submenu with 13 items)**

**Parent Menu:**
| Property | Details |
|----------|---------|
| **Menu Label** | Footer |
| **Icon** | `fa fa-cogs` |
| **Type** | Submenu (xn-openable) |

**Submenu Items:**

#### **1. About Us**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/about_us` |
| **Controller** | `Admin_controller::about_us()` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

#### **2. Footer Same Pages (7 Items)**

| Menu Item | Route | Controller |
|-----------|-------|------------|
| **Awards** | `/admin_controller/footer_same_page/awards` | `Admin_controller::footer_same_page('awards')` |
| **Newsroom** | `/admin_controller/footer_same_page/newsroom` | `Admin_controller::footer_same_page('newsroom')` |
| **Events** | `/admin_controller/footer_same_page/events` | `Admin_controller::footer_same_page('events')` |
| **Careers** | `/admin_controller/footer_same_page/careers` | `Admin_controller::footer_same_page('careers')` |
| **Clients** | `/admin_controller/footer_same_page/clients` | `Admin_controller::footer_same_page('clients')` |
| **Milestones** | `/admin_controller/footer_same_page/milestones` | `Admin_controller::footer_same_page('milestones')` |
| **Testimonials** | `/admin_controller/footer_same_page/testimonials` | `Admin_controller::footer_same_page('testimonials')` |

**Operations:** CREATE, READ, UPDATE, DELETE

#### **3. Gallery**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/gallery` |
| **Controller** | `Admin_controller::gallery()` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

#### **4. Contact Us**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/contact_us` |
| **Controller** | `Admin_controller::contact_us()` |
| **Operations** | CREATE, READ, UPDATE |

#### **5. Social Media Link**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/social_link` |
| **Controller** | `Admin_controller::social_link()` |
| **Operations** | CREATE, READ, UPDATE, DELETE |

#### **6. Terms And Conditions**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/tnc` |
| **Controller** | `Admin_controller::tnc()` |
| **Operations** | CREATE, READ, UPDATE |

#### **7. Privacy and Policy**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/pnp` |
| **Controller** | `Admin_controller::pnp()` |
| **Operations** | CREATE, READ, UPDATE |

---

### **K. Database Access**

#### **1. Public Database**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/public_database` |
| **Controller** | `Admin_controller::public_database()` |
| **Operations** | READ |

#### **2. Client Database**

| Property | Details |
|----------|---------|
| **Route** | `/admin/client-database` |
| **Operations** | READ |

---

### **L. Applications**

#### **1. Franchise Application**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/franchise_application` |
| **Controller** | `Admin_controller::franchise_application()` |
| **Model** | `Admin_model::get_franchise_database()` |
| **Table** | `apply_franchise_now` |
| **Operations** | READ |

**Data Fields:**
- Franchise name, email, mobile
- Country, State, District
- Application date
- Status

#### **2. Job Application**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/job_application` |
| **Controller** | `Admin_controller::job_application()` |
| **Model** | `Admin_model::get_job_database()` |
| **Table** | `apply_job_now` |
| **Operations** | READ |

#### **3. Enquiry Form**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/enquiry_form` |
| **Controller** | `Admin_controller::enquiry_form()` |
| **Operations** | READ |

---

### **M. Supports**

#### **1. Feedback and Suggestions**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/feed_back_suggetion` |
| **Controller** | `Admin_controller::feed_back_suggetion()` |
| **Operations** | READ |

#### **2. Chat with Us**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/feed_back_users` |
| **Controller** | `Admin_controller::feed_back_users()` |
| **Operations** | READ, CREATE |

---

### **N. Change Password**

| Property | Details |
|----------|---------|
| **Route** | `/admin_controller/change_password_head_dashboard` |
| **Controller** | `Admin_controller::change_password_head_dashboard()` |
| **View** | `admin/franchise/change_password.php` |
| **Operations** | UPDATE |

**Form Fields:**
- `old_password` - Password input
- `new_password` - Password input
- `confirm_password` - Password input

**CRUD Flow:**
```
UPDATE: PUT /api/admin/change-password → Updates corporate user password
```

---

## 3. DATABASE SCHEMA

### **A. Core Tables**

#### **1. `users` Table**
```sql
CREATE TABLE `users` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `first_name` VARCHAR(50),
  `phone` VARCHAR(20),
  `active` TINYINT(1) DEFAULT 1,
  `created_on` INT(11) NOT NULL,
  `last_login` INT(11),
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
);
```

**Purpose:** User authentication and profile
**CRUD Operations:** CREATE, READ, UPDATE

---

#### **2. `users_groups` Table**
```sql
CREATE TABLE `users_groups` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `group_id` INT(11) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `user_group` (`user_id`, `group_id`)
);
```

**Purpose:** User role assignment
**Group IDs:**
- `5` - Corporate (Franchise Head)
- `6` - Head Office
- `7` - Regional Office
- `8` - Branch Office

---

#### **3. `franchise_holder` Table**
```sql
CREATE TABLE `franchise_holder` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `country` INT(11) DEFAULT 0,
  `state` INT(11) DEFAULT 0,
  `district` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`country`) REFERENCES `country_tbl`(`id`),
  FOREIGN KEY (`state`) REFERENCES `state_tbl`(`id`),
  FOREIGN KEY (`district`) REFERENCES `district_tbl`(`id`)
);
```

**Purpose:** Franchise location mapping
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

---

#### **4. `franchise_ads` Table**
```sql
CREATE TABLE `franchise_ads` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `franchise_holder_id` INT(11) NOT NULL,
  `my_app_name` VARCHAR(100) NOT NULL COMMENT 'Mymedia, Myjoy, Myshop, etc.',
  `my_sub_app_name` VARCHAR(100) NOT NULL COMMENT 'News, Movies, Products, etc.',
  `image_path` VARCHAR(255),
  `image_url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`franchise_holder_id`) REFERENCES `franchise_holder`(`id`) ON DELETE CASCADE,
  INDEX `idx_app_name` (`my_app_name`, `my_sub_app_name`)
);
```

**Purpose:** Advertisement management for franchise
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

---

#### **5. `franchise_staff` Table**
```sql
CREATE TABLE `franchise_staff` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `first_name` VARCHAR(100),
  `phone` VARCHAR(20),
  `email` VARCHAR(254),
  `address` TEXT,
  `created_on` DATETIME,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

**Purpose:** Franchise staff details
**CRUD Operations:** CREATE, READ, UPDATE, DELETE

---

#### **6. `franchise_terms_conditions` Table**
```sql
CREATE TABLE `franchise_terms_conditions` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `content` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose:** Franchise terms and conditions content
**CRUD Operations:** CREATE, READ, UPDATE

---

#### **7. `apply_franchise_now` Table**
```sql
CREATE TABLE `apply_franchise_now` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `franchise_name` VARCHAR(255),
  `franchise_email_id` VARCHAR(254),
  `franchise_mobile_number` VARCHAR(20),
  `franchise_country` INT(11),
  `franchise_state` INT(11),
  `franchise_district` INT(11),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`franchise_country`) REFERENCES `country_tbl`(`id`),
  FOREIGN KEY (`franchise_state`) REFERENCES `state_tbl`(`id`),
  FOREIGN KEY (`franchise_district`) REFERENCES `district_tbl`(`id`)
);
```

**Purpose:** Franchise application submissions
**CRUD Operations:** READ

---

#### **8. `apply_job_now` Table**
```sql
CREATE TABLE `apply_job_now` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `applicant_name` VARCHAR(255),
  `applicant_email` VARCHAR(254),
  `applicant_phone` VARCHAR(20),
  `franchise_country` INT(11),
  `resume_path` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`franchise_country`) REFERENCES `country_tbl`(`id`)
);
```

**Purpose:** Job application submissions
**CRUD Operations:** READ

---

## 4. COMPLETE CRUD OPERATIONS

### **A. HEAD OFFICE LOGIN MANAGEMENT**

#### **Create Head Office User**

**Endpoint:** `POST /api/franchise/head-office-login`

**Request Body:**
```typescript
{
  franchise_name: string;
  franchise_email_id: string;
  franchise_mobile_number: string;
  username: string; // Auto-generated: my_{country_name}
  franchise_country: number; // Country ID
  group_id: 6; // Fixed for head office
}
```

**Response:**
```typescript
{
  success: true;
  message: "Head office user created successfully";
  data: {
    userId: number;
    username: string;
    email: string;
    password: "123456"; // Default password
  }
}
```

**Business Logic:**
1. Check if username already exists
2. If exists, update user details
3. If not exists, create new user with group_id = 6
4. Save franchise_holder record with country mapping
5. Send email with login credentials

---

#### **Get All Head Office Users**

**Endpoint:** `GET /api/franchise/head-office-login`

**Response:**
```typescript
{
  success: true;
  data: [
    {
      id: number;
      username: string;
      first_name: string;
      email: string;
      phone: string;
      active: number; // 1 = Active, 0 = Inactive
      country: number;
      country_name: string;
    }
  ]
}
```

---

#### **Reset Password**

**Endpoint:** `POST /api/franchise/reset-password/:userId`

**Response:**
```typescript
{
  success: true;
  message: "Password reset successfully to 123456";
}
```

---

#### **Toggle User Status**

**Endpoint:** `PUT /api/franchise/user-status/:userId`

**Request Body:**
```typescript
{
  active: number; // 1 or 0
}
```

---

### **B. HEADER ADS MANAGEMENT**

#### **Get All Ads**

**Endpoint:** `GET /api/franchise/header-ads`

**Response:**
```typescript
{
  success: true;
  data: {
    myApps: [
      {
        name: "Mymedia";
        icon: string;
        sub_group: ["News", "Unions", "Federation", "IDs", "Notice", "Me"];
      }
    ];
    uploadedAds: {
      "Mymedia": {
        "News": {
          id: number;
          image_path: string;
          image_url: string;
        }
      }
    }
  }
}
```

---

#### **Upload/Update Ad**

**Endpoint:** `POST /api/franchise/header-ads`

**Request (multipart/form-data):**
```typescript
{
  franchise_holder_id: number;
  my_app_name: string; // "Mymedia", "Myjoy", etc.
  my_sub_app_name: string; // "News", "Movies", etc.
  image_name: File; // Image file
  image_url: string; // Redirect URL
}
```

**Response:**
```typescript
{
  success: true;
  message: "Ad uploaded successfully";
  data: {
    id: number;
    image_path: string;
    image_url: string;
  }
}
```

**Business Logic:**
1. Upload image to S3/Wasabi
2. Check if ad exists for app_name + sub_app_name
3. If exists, update image and URL
4. If not exists, create new ad record
5. Return uploaded image path

---

#### **Delete Ad**

**Endpoint:** `DELETE /api/franchise/header-ads/:id`

**Response:**
```typescript
{
  success: true;
  message: "Ad deleted successfully";
}
```

---

### **C. TERMS AND CONDITIONS**

#### **Get Terms**

**Endpoint:** `GET /api/franchise/terms-conditions`

**Response:**
```typescript
{
  success: true;
  data: {
    id: number;
    content: string; // HTML content
  }
}
```

---

#### **Create/Update Terms**

**Endpoint:** `POST /api/franchise/terms-conditions`

**Request Body:**
```typescript
{
  franchise_content: string; // HTML content
}
```

**Response:**
```typescript
{
  success: true;
  message: "Terms and conditions saved successfully";
}
```

---

### **D. FRANCHISE APPLICATIONS**

#### **Get All Franchise Applications**

**Endpoint:** `GET /api/admin/franchise-applications`

**Response:**
```typescript
{
  success: true;
  data: [
    {
      id: number;
      franchise_name: string;
      franchise_email_id: string;
      franchise_mobile_number: string;
      country_name: string;
      state_name: string;
      district_name: string;
      created_at: string;
    }
  ]
}
```

---

### **E. JOB APPLICATIONS**

#### **Get All Job Applications**

**Endpoint:** `GET /api/admin/job-applications`

**Response:**
```typescript
{
  success: true;
  data: [
    {
      id: number;
      applicant_name: string;
      applicant_email: string;
      applicant_phone: string;
      country_name: string;
      resume_path: string;
      created_at: string;
    }
  ]
}
```

---

## 5. API ENDPOINTS SUMMARY

### **Franchise Management APIs**

```typescript
// Head Office Login
GET    /api/franchise/head-office-login
POST   /api/franchise/head-office-login
PUT    /api/franchise/head-office-login/:id
POST   /api/franchise/reset-password/:userId
PUT    /api/franchise/user-status/:userId

// Advertisement Management
GET    /api/franchise/header-ads
POST   /api/franchise/header-ads
PUT    /api/franchise/header-ads/:id
DELETE /api/franchise/header-ads/:id

GET    /api/franchise/popup-ads
POST   /api/franchise/popup-ads
PUT    /api/franchise/popup-ads/:id
DELETE /api/franchise/popup-ads/:id

GET    /api/franchise/company-header-ads
POST   /api/franchise/company-header-ads
PUT    /api/franchise/company-header-ads/:id

GET    /api/franchise/main-page-ads
POST   /api/franchise/main-page-ads
PUT    /api/franchise/main-page-ads/:id

// Terms and Conditions
GET    /api/franchise/terms-conditions
POST   /api/franchise/terms-conditions
PUT    /api/franchise/terms-conditions/:id

// Applications
GET    /api/admin/franchise-applications
GET    /api/admin/job-applications
GET    /api/admin/enquiry-forms

// Support
GET    /api/admin/feedback
GET    /api/admin/chat-messages
POST   /api/admin/chat-messages

// Password Management
PUT    /api/admin/change-password
```

---

## 6. REACT COMPONENT STRUCTURE

### **Corporate Dashboard Layout**

```
CorporateDashboard/
├── Layout/
│   ├── CorporateLayout.tsx
│   ├── CorporateSidebar.tsx
│   ├── CorporateHeader.tsx
│   └── CorporateBreadcrumb.tsx
├── Dashboard/
│   ├── CorporateDashboard.tsx
│   ├── DashboardWidgets.tsx
│   └── StatisticsCards.tsx
├── HeadOffice/
│   ├── HeadOfficeList.tsx
│   ├── HeadOfficeForm.tsx
│   └── HeadOfficeTable.tsx
├── Advertisements/
│   ├── HeaderAds/
│   │   ├── HeaderAdsList.tsx
│   │   ├── HeaderAdsUpload.tsx
│   │   └── HeaderAdsModal.tsx
│   ├── PopupAds/
│   │   ├── PopupAdsList.tsx
│   │   └── PopupAdsForm.tsx
│   ├── CompanyHeaderAds/
│   │   ├── CompanyHeaderAdsList.tsx
│   │   └── CompanyHeaderAdsForm.tsx
│   └── MainPageAds/
│       ├── MainPageAdsList.tsx
│       └── MainPageAdsForm.tsx
├── Profile/
│   ├── ProfileView.tsx
│   └── ProfileEdit.tsx
├── Applications/
│   ├── FranchiseApplications.tsx
│   ├── JobApplications.tsx
│   └── EnquiryForms.tsx
├── Footer/
│   ├── AboutUs.tsx
│   ├── FooterPages.tsx
│   ├── Gallery.tsx
│   ├── ContactUs.tsx
│   └── SocialLinks.tsx
├── Support/
│   ├── Feedback.tsx
│   └── ChatSupport.tsx
├── Settings/
│   ├── TermsConditions.tsx
│   └── ChangePassword.tsx
└── Shared/
    ├── DataTable.tsx
    ├── FileUpload.tsx
    ├── RichTextEditor.tsx
    ├── StatusToggle.tsx
    └── ImagePreview.tsx
```

---

## 7. COMPLETE TABLE REFERENCE

### **Tables Used in Corporate Dashboard**

| # | Table Name | Purpose | CRUD Operations |
|---|------------|---------|-----------------|
| 1 | `users` | User authentication | CREATE, READ, UPDATE |
| 2 | `users_groups` | User role assignment | CREATE, READ |
| 3 | `franchise_holder` | Franchise location mapping | CREATE, READ, UPDATE, DELETE |
| 4 | `franchise_ads` | Advertisement management | CREATE, READ, UPDATE, DELETE |
| 5 | `franchise_staff` | Staff details | CREATE, READ, UPDATE, DELETE |
| 6 | `franchise_terms_conditions` | Terms content | CREATE, READ, UPDATE |
| 7 | `apply_franchise_now` | Franchise applications | READ |
| 8 | `apply_job_now` | Job applications | READ |
| 9 | `country_tbl` | Country master | READ |
| 10 | `state_tbl` | State master | READ |
| 11 | `district_tbl` | District master | READ |

---

## 8. SUMMARY

### **Corporate Dashboard Overview**

| Category | Menu Items | Total Tables | Total APIs |
|----------|------------|--------------|------------|
| **Dashboard** | 1 | - | 1 |
| **Head Office Login** | 1 | 3 | 5 |
| **Advertisements** | 4 | 1 | 12 |
| **Profile** | 1 | 1 | 2 |
| **Application Details** | 1 | - | 1 |
| **Terms & Conditions** | 1 | 1 | 3 |
| **Footer** | 9 | - | 27 |
| **Database Access** | 2 | - | 2 |
| **Applications** | 3 | 2 | 3 |
| **Support** | 2 | - | 3 |
| **Change Password** | 1 | 1 | 1 |
| **TOTAL** | **26** | **11** | **60+** |

---

### **CRUD Operations Summary**

| Operation | Count | Percentage |
|-----------|-------|------------|
| CREATE | 8 | 73% |
| READ | 11 | 100% |
| UPDATE | 8 | 73% |
| DELETE | 4 | 36% |

---

### **Special Features**

✅ **Auto-Generated Usernames** - `my_{country_name}` format
✅ **Email Notifications** - Login credentials sent via email
✅ **Default Password** - `123456` for all franchise users
✅ **Password Reset** - One-click password reset
✅ **Status Toggle** - Active/Inactive user management
✅ **Multi-Category Ads** - 8 app categories with 6 subcategories each
✅ **Image Upload** - S3/Wasabi integration
✅ **Rich Text Editor** - HTML content for terms & conditions
✅ **Country-Based Access** - One head office per country
✅ **Application Management** - View franchise and job applications

---

## 9. MIGRATION CHECKLIST

### **Phase 1: Database Setup**
- [ ] Create all 11 tables with proper indexes
- [ ] Set up foreign key relationships
- [ ] Add franchise user groups (5, 6, 7, 8)
- [ ] Add sample data for testing

### **Phase 2: Backend Development**
- [ ] Set up Node.js + Express + TypeScript
- [ ] Create Sequelize models (11 models)
- [ ] Implement all API endpoints (60+ endpoints)
- [ ] Add authentication middleware
- [ ] Add role-based access control (group_id === 5)
- [ ] Set up file upload with Multer + S3
- [ ] Add email service for login credentials
- [ ] Add validation with Zod

### **Phase 3: Frontend Development**
- [ ] Set up React + TypeScript + Vite
- [ ] Create corporate layout components
- [ ] Implement dashboard with widgets
- [ ] Implement head office login management
- [ ] Implement advertisement management (4 types)
- [ ] Add file upload components
- [ ] Add rich text editor for terms
- [ ] Implement footer content management
- [ ] Implement application viewing
- [ ] Add support features (feedback, chat)
- [ ] Implement React Query for data fetching
- [ ] Add Redux Toolkit for state management

### **Phase 4: Testing**
- [ ] Unit tests for all API endpoints
- [ ] Integration tests for CRUD operations
- [ ] E2E tests for critical flows
- [ ] File upload testing
- [ ] Email notification testing

### **Phase 5: Deployment**
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Production deployment
- [ ] Monitoring and logging

---

## 📊 FINAL SUMMARY

### **Corporate Dashboard Statistics**

| Metric | Count |
|--------|-------|
| **Total Menu Items** | 35 |
| **Main Menu Items** | 19 |
| **Footer Submenu Items** | 14 |
| **Support Submenu Items** | 2 |
| **Total Database Tables** | 33 |
| **Total API Endpoints** | 80+ |
| **CRUD Operations** | CREATE, READ, UPDATE, DELETE, RESET, TOGGLE |

---

### **Menu Items by Category**

| Category | Count | Menu Items |
|----------|-------|------------|
| **Dashboard** | 1 | Dashboard |
| **Franchise Management** | 1 | Head Office Login |
| **Advertisement** | 4 | Header Ads, Popup Add, My Company Header Ads, Main Page Ads |
| **Profile & Settings** | 3 | Profile, Application Details, Terms and Conditions |
| **Footer Content** | 14 | About Us, Awards, Newsroom, Events, Careers, Clients, Milestones, Testimonials, Gallery, Contact Us, Social Media, T&C, Privacy, Instructions |
| **Database Access** | 2 | Public Database, Client Database |
| **Applications** | 4 | Franchise Application, Job Application, Enquiry Form, Technical Support |
| **Support** | 2 | Feedback and Suggestions, Chat with Us |
| **Account** | 2 | Change Password, Logout |

---

### **Tables by Purpose**

| Purpose | Count | Tables |
|---------|-------|--------|
| **User Management** | 3 | users, users_groups, user_registration_form |
| **Franchise System** | 2 | franchise_holder, franchise_advertise |
| **Location Data** | 4 | continent_tbl, country_tbl, state_tbl, district_tbl |
| **App Categories** | 2 | group_create, create_details |
| **Advertisements** | 3 | popup_ads, advertise, main_page_ads |
| **Footer Content** | 11 | about, awards, newsroom, events, careers, clients, milestones, testimonials, gallery, contact_us, social_link |
| **Legal** | 3 | franchise_terms_conditions, tnc_details, privacy_policy |
| **Applications** | 3 | apply_franchise_now, apply_job_now, enquiry_form |
| **Support** | 2 | feedback_suggetions, feedback_suggetions_users |

---

### **Key Features Summary**

✅ **Auto-Generated Usernames** - `my_{country_name}` format for head office
✅ **Email Notifications** - Login credentials sent via CURL API
✅ **Default Password** - `123456` for all franchise users
✅ **Password Reset** - One-click reset to default
✅ **Status Toggle** - Active/Inactive user management
✅ **Multi-Category Ads** - 11 apps × 6 subcategories = 66 ad slots
✅ **Image Upload** - File upload for ads and content
✅ **Rich Text Editor** - HTML content for terms & conditions
✅ **Country-Based Access** - One head office per country
✅ **Application Viewing** - Read-only access to submissions
✅ **Location Hierarchy** - Continent → Country → State → District
✅ **Footer Management** - 14 footer pages with CRUD operations
✅ **Support System** - Feedback and chat functionality

---

### **Implementation Priority**

**Phase 1 - Core Features (High Priority):**
1. Dashboard with statistics
2. Head Office Login Management
3. Header Ads Management
4. Terms and Conditions

**Phase 2 - Advertisement System (Medium Priority):**
5. Popup Ads
6. My Company Header Ads
7. Main Page Ads

**Phase 3 - Content Management (Medium Priority):**
8. Footer Content (14 pages)
9. Profile Management
10. Application Details

**Phase 4 - Database & Applications (Low Priority):**
11. Public Database
12. Client Database
13. Franchise Applications
14. Job Applications
15. Enquiry Forms

**Phase 5 - Support & Settings (Low Priority):**
16. Feedback and Suggestions
17. Chat with Us
18. Change Password

---

**END OF DOCUMENT**
