# 📱 HOME MOBILE VIEW - LAYOUT DESIGN & DATABASE STRUCTURE

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Mobile Detection & Template Structure](#mobile-detection--template-structure)
3. [Complete Layout Sections](#complete-layout-sections)
4. [Database Tables & Query Structures](#database-tables--query-structures)
5. [Data Flow & Display Methods](#data-flow--display-methods)
6. [React TypeScript Implementation Guide](#react-typescript-implementation-guide)

---

## 1. OVERVIEW

### **Mobile View Access**
- **Controller:** `Home::index()`
- **Mobile Detection:** `$this->mobile_detect->isMobile()`
- **Template:** `application/views/front/template.php`
- **Header:** `application/views/front/header_mobile.php`
- **Main Content:** `application/views/home/index_mobile.php`

### **Key Features**
- ✅ Responsive mobile-first design
- ✅ Bootstrap 4.6.0 carousel sliders
- ✅ Gradient background themes
- ✅ Dark/Light mode toggle
- ✅ User profile management
- ✅ Social media integration
- ✅ App category navigation
- ✅ Dynamic content carousels

---

## 2. MOBILE DETECTION & TEMPLATE STRUCTURE

### **2.1 Controller Logic**

<augment_code_snippet path="application/controllers/Home.php" mode="EXCERPT">
````php
public function index(){
    $data['groupname'] = 'Mygroup';
    $data['logo'] = $this->admin_model->get_logo_image();
    $data['top_icon'] = $this->admin_model->get_topnav_icon_list();
    $data['navName'] = '';
    $navName = 'my-apps';
    $data['body_content'] = $this->admin_model->get_bodynav_icon_list($navName);
    $group = $this->home_model->get_group_name_detailsbyname('Mygroup');
    $data['group_details'] = $group;
    $data['social_link'] = $this->admin_model->get_social_link($group->id);
    $data['copy_right'] = $this->admin_model->get_copy_right();
    $data['about_us'] = $this->admin_model->get_about_all(0);
    $data['main_ads'] = $this->admin_model->main_ads_group();
    $data['newsroom'] = $this->admin_model->get_newsroom_latest_data();
    $data['awards'] = $this->admin_model->get_awards_latest_data();
    $data['event'] = $this->admin_model->get_events_latest_data();
    $data['gallery'] = $this->admin_model->get_gallery_latest_data();
    $data['testimonials'] = $this->admin_model->get_testimonials_data();
    $data['base_url'] = 1;
    if ($this->mobile_detect->isMobile()) {
        $data['main_content'] = 'home/index_mobile';
    }else{
        $data['main_content'] = 'home/index';
    }
    $this->load->view('front/template', $data);
}
````
</augment_code_snippet>

### **2.2 Template Structure**

<augment_code_snippet path="application/views/front/template.php" mode="EXCERPT">
````php
<?php 
if ($this->mobile_detect->isMobile()) { 
    $this->load->view('front/header_mobile.php');
} else { 
    $this->load->view('front/header.php');
}
?>
<?php $this->load->view($main_content); ?>
````
</augment_code_snippet>

---

## 3. COMPLETE LAYOUT SECTIONS

### **📱 SECTION 1: Mobile Header (Fixed Top Navigation)**

**File:** `application/views/front/header_mobile.php`

**Layout Components:**
1. **Top Navigation Bar** (Fixed, Background: #057284)
   - Horizontal scrollable app icons
   - Dynamic app list from `$top_icon['myapps']`

2. **Logo Header** (White background, 100% width)
   - Left: User profile icon/avatar
   - Center: Group logo image
   - Right: Dark/Light mode toggle + Group settings icon

3. **Header Carousel** (Margin-top: 24%)
   - Dynamic slides from database
   - Auto-play carousel
   - Indicators and controls

**Display Method:**
```php
<nav class="navbar navbar-expand-lg fixed-top navbar-dark" style="background:#057284">
  <div class="table-responsive">
    <ul class="navbar-nav" id="top_myapps" style="width:max-content;"></ul>
  </div>
  <div class="header-logo" style="background:#fff; width: 100%;">
    <!-- User profile + Logo + Settings -->
  </div>
</nav>
```

**Tables Used:**
- `users` - User authentication and profile
- `group` - Logo and branding
- `social_link` - Social media URLs

---

### **📱 SECTION 2: My Apps Section**

**File:** `application/views/home/index_mobile.php` (Lines 1-14)

**Layout Design:**
- Gradient background: `linear-gradient(-45deg, #ac32e4, #7918f2, #4801ff)`
- Centered flex column layout
- Full-width buttons with icons
- White bordered buttons (border-radius: 25px)

**Display Method:**
```php
<div class="bg-g1 size1 flex-w flex-col-c-sb p-l-15 p-r-15 p-t-55 p-b-35 respon1">
  <div class="flex-col-c p-t-20 p-b-50">
    <?php 
      $groupLogin = $top_icon['myapps'];
      foreach ($groupLogin as $k => $val) { ?>
        <a class="flex-c-m s1-txt2 size3 how-btn" href="<?php echo site_url('group/'.$val->name) ?>">
          <img style="width: 20px;" src="<?php echo base_url().$val->icon ?>"> 
          &nbsp;&nbsp;<?php echo $val->name ?>
        </a>
      <?php } ?>
  </div>
</div>
```

**Tables Used:**
- `group_create` - App categories
- `create_details` - App icons and URLs

**Query Structure:**
```sql
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Apps'
ORDER BY gc.id;
```

---

### **📱 SECTION 3: About Us Carousel**

**File:** `application/views/home/index_mobile.php` (Lines 17-51)

**Layout Design:**
- Bootstrap carousel with indicators
- Centered images (width: 50%)
- Text content below image
- Clickable link to full About Us page

**Display Method:**
```php
<?php if (!empty($about_us)) { ?>
  <div class="container">
    <div id="imageCarousel" class="carousel slide" data-ride="carousel">
      <ol class="carousel-indicators">
        <?php $b=1; foreach ($about_us as $key => $val) { ?>
          <li data-target="#imageCarousel" data-slide-to="<?php echo $b ?>" 
              class="<?php if($b == 1) echo 'active' ?>"></li>
        <?php $b++; } ?>
      </ol>
      <div class="carousel-inner">
        <?php $k=1; foreach ($about_us as $key => $val) { ?>
         <div class="carousel-item <?php if($k == 1) echo 'active' ?>">
            <img src="<?php echo $this->filemanager->getFilePath($val->image) ?>" />
            <div class="text"><?php echo $val->content;?></div>
         </div>
        <?php $k++; } ?>
      </div>
    </div>
  </div>
<?php } ?>
```

**Tables Used:**
- `about` - About Us content

**Query Structure:**
```sql
SELECT * FROM about WHERE group_id = 0;
```

---

### **📱 SECTION 4: My Company Section**

**File:** `application/views/home/index_mobile.php` (Lines 67-86)

**Layout Design:**
- 2-column grid layout (col-6)
- Rounded icon images (border-radius: 50%)
- Icon size: 50px × 50px
- App name below icon
- Excludes "Mygroup" app

**Display Method:**
```php
<div class="container">
  <div class="row">
    <?php
      $myCompany = $top_icon['myCompany'];
      foreach ($myCompany as $k => $val) {
        if ($val->name != 'Mygroup') { ?>
          <div class="col-6">
            <a href="<?php echo site_url('group/'.$val->name) ?>">
              <img style="width: 50px; border-radius: 50%;"
                   src="<?php echo base_url().$val->icon ?>">
              <p><?php echo $val->name ?></p>
            </a>
          </div>
        <?php }
      } ?>
  </div>
</div>
```

**Tables Used:**
- `group_create` - Company apps category
- `create_details` - App details

**Query Structure:**
```sql
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Company'
ORDER BY gc.id;
```

---

### **📱 SECTION 5: Main Ads Carousel**

**File:** `application/views/home/index_mobile.php` (Lines 88-134)

**Layout Design:**
- 3-slot advertisement carousel
- Full-width images
- Clickable ads with URLs
- Auto-play enabled
- Carousel controls (prev/next)

**Display Method:**
```php
<?php if (!empty($main_ads)) { ?>
  <div id="carouselExampleControls" class="carousel slide" data-ride="carousel">
    <div class="carousel-inner">
      <?php if (!empty($main_ads->ads1)) { ?>
        <div class="carousel-item active">
          <a href="<?php echo $main_ads->ads1_url ?>">
            <img src="<?php echo $this->filemanager->getFilePath($main_ads->ads1) ?>" />
          </a>
        </div>
      <?php } ?>
      <?php if (!empty($main_ads->ads2)) { ?>
        <div class="carousel-item">
          <a href="<?php echo $main_ads->ads2_url ?>">
            <img src="<?php echo $this->filemanager->getFilePath($main_ads->ads2) ?>" />
          </a>
        </div>
      <?php } ?>
      <?php if (!empty($main_ads->ads3)) { ?>
        <div class="carousel-item">
          <a href="<?php echo $main_ads->ads3_url ?>">
            <img src="<?php echo $this->filemanager->getFilePath($main_ads->ads3) ?>" />
          </a>
        </div>
      <?php } ?>
    </div>
    <a class="carousel-control-prev" href="#carouselExampleControls" data-slide="prev">
      <span class="carousel-control-prev-icon"></span>
    </a>
    <a class="carousel-control-next" href="#carouselExampleControls" data-slide="next">
      <span class="carousel-control-next-icon"></span>
    </a>
  </div>
<?php } ?>
```

**Tables Used:**
- `main_ads` - Main page advertisements

**Query Structure:**
```sql
SELECT mn.id, mn.ads1, mn.ads2, mn.ads3,
       mn.ads1_url, mn.ads2_url, mn.ads3_url
FROM main_ads mn;
```

**Table Schema:**
```sql
CREATE TABLE main_ads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ads1 VARCHAR(255),        -- Image path for ad slot 1
  ads2 VARCHAR(255),        -- Image path for ad slot 2
  ads3 VARCHAR(255),        -- Image path for ad slot 3
  ads1_url VARCHAR(255),    -- Click URL for ad 1
  ads2_url VARCHAR(255),    -- Click URL for ad 2
  ads3_url VARCHAR(255),    -- Click URL for ad 3
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### **📱 SECTION 6: Online Apps Section**

**File:** `application/views/home/index_mobile.php` (Lines 138-158)

**Layout Design:**
- 2-column grid layout (col-6)
- Rounded icon images (50px × 50px)
- App name below icon
- Centered alignment

**Display Method:**
```php
<div class="container">
  <h3 class="text-center">My Online Apps</h3>
  <div class="row">
    <?php
      $online = $top_icon['online'];
      foreach ($online as $k => $val) { ?>
        <div class="col-6">
          <a href="<?php echo site_url('group/'.$val->name) ?>">
            <img style="width: 50px; border-radius: 50%;"
                 src="<?php echo base_url().$val->icon ?>">
            <p><?php echo $val->name ?></p>
          </a>
        </div>
      <?php } ?>
  </div>
</div>
```

**Tables Used:**
- `group_create` - Online apps category
- `create_details` - App details

**Query Structure:**
```sql
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Onine Apps'
ORDER BY gc.id;
```

---

### **📱 SECTION 7: Offline Apps Section**

**File:** `application/views/home/index_mobile.php` (Lines 159-179)

**Layout Design:**
- Same as Online Apps section
- 2-column grid layout
- Rounded icons (50px × 50px)

**Display Method:**
```php
<div class="container">
  <h3 class="text-center">My Offline Apps</h3>
  <div class="row">
    <?php
      $offline = $top_icon['offline'];
      foreach ($offline as $k => $val) { ?>
        <div class="col-6">
          <a href="<?php echo site_url('group/'.$val->name) ?>">
            <img style="width: 50px; border-radius: 50%;"
                 src="<?php echo base_url().$val->icon ?>">
            <p><?php echo $val->name ?></p>
          </a>
        </div>
      <?php } ?>
  </div>
</div>
```

**Tables Used:**
- `group_create` - Offline apps category
- `create_details` - App details

**Query Structure:**
```sql
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Offline Apps'
ORDER BY gc.id;
```

---

### **📱 SECTION 8: Footer Content Carousel**

**File:** `application/views/home/index_mobile.php` (Lines 181-226)

**Layout Design:**
- 4-item carousel (Newsroom, Awards, Events, Gallery)
- Each item shows latest content
- Image + Title + Description
- Clickable links to detail pages

**Display Method:**
```php
<div id="footerCarousel" class="carousel slide" data-ride="carousel">
  <div class="carousel-inner">
    <!-- Newsroom -->
    <?php if (!empty($newsroom)) { ?>
      <div class="carousel-item active">
        <img src="<?php echo $this->filemanager->getFilePath($newsroom->image) ?>" />
        <h4><?php echo $newsroom->title ?></h4>
        <p><?php echo substr($newsroom->description, 0, 100) ?>...</p>
        <a href="<?php echo site_url('home/newsroom_detail/'.$newsroom->id) ?>">Read More</a>
      </div>
    <?php } ?>

    <!-- Awards -->
    <?php if (!empty($awards)) { ?>
      <div class="carousel-item">
        <img src="<?php echo $this->filemanager->getFilePath($awards->image) ?>" />
        <h4><?php echo $awards->title ?></h4>
        <p><?php echo substr($awards->description, 0, 100) ?>...</p>
        <a href="<?php echo site_url('home/awards_detail/'.$awards->id) ?>">Read More</a>
      </div>
    <?php } ?>

    <!-- Events -->
    <?php if (!empty($event)) { ?>
      <div class="carousel-item">
        <img src="<?php echo $this->filemanager->getFilePath($event->image) ?>" />
        <h4><?php echo $event->title ?></h4>
        <p><?php echo substr($event->description, 0, 100) ?>...</p>
        <a href="<?php echo site_url('home/events_detail/'.$event->id) ?>">Read More</a>
      </div>
    <?php } ?>

    <!-- Gallery -->
    <?php if (!empty($gallery)) { ?>
      <div class="carousel-item">
        <img src="<?php echo $this->filemanager->getFilePath($gallery->image_name) ?>" />
        <h4>Latest Gallery</h4>
        <a href="<?php echo site_url('home/gallery') ?>">View Gallery</a>
      </div>
    <?php } ?>
  </div>
</div>
```

**Tables Used:**
- `newsroom` - Latest newsroom content
- `awards` - Latest awards content
- `events` - Latest events content
- `gallery_images_master` - Latest gallery image

**Query Structures:**
```sql
-- Newsroom
SELECT * FROM newsroom ORDER BY id DESC LIMIT 1;

-- Awards
SELECT * FROM awards ORDER BY id DESC LIMIT 1;

-- Events
SELECT * FROM events ORDER BY id DESC LIMIT 1;

-- Gallery
SELECT * FROM gallery_images_master ORDER BY image_id DESC LIMIT 1;
```

---

### **📱 SECTION 9: Navigation Buttons**

**File:** `application/views/home/index_mobile.php` (Lines 289-299)

**Layout Design:**
- 4 full-width buttons
- Gradient background
- White text
- Icon + Text layout

**Display Method:**
```php
<div class="container">
  <a class="btn btn-primary btn-block" href="#myApps">
    <i class="fa fa-th"></i> My Apps
  </a>
  <a class="btn btn-primary btn-block" href="#myCompany">
    <i class="fa fa-building"></i> My Company
  </a>
  <a class="btn btn-primary btn-block" href="#onlineApps">
    <i class="fa fa-globe"></i> My Online Apps
  </a>
  <a class="btn btn-primary btn-block" href="#offlineApps">
    <i class="fa fa-download"></i> My Offline Apps
  </a>
</div>
```

---

### **📱 SECTION 10: Testimonials Carousel**

**File:** `application/views/home/index_mobile.php` (Lines 304-356)

**Layout Design:**
- Bootstrap carousel
- User image (circular)
- Testimonial text
- User name and designation
- Star ratings
- Limit: 4 testimonials

**Display Method:**
```php
<?php if (!empty($testimonials)) { ?>
  <div id="testimonialsCarousel" class="carousel slide" data-ride="carousel">
    <div class="carousel-inner">
      <?php $t=1; foreach ($testimonials as $key => $val) { ?>
        <div class="carousel-item <?php if($t == 1) echo 'active' ?>">
          <img class="rounded-circle"
               src="<?php echo $this->filemanager->getFilePath($val->image) ?>" />
          <p class="testimonial-text"><?php echo $val->testimonial ?></p>
          <h5><?php echo $val->name ?></h5>
          <p><?php echo $val->designation ?></p>
          <div class="rating">
            <?php for($i=1; $i<=5; $i++) {
              if($i <= $val->rating) { ?>
                <i class="fa fa-star"></i>
              <?php } else { ?>
                <i class="fa fa-star-o"></i>
              <?php }
            } ?>
          </div>
        </div>
      <?php $t++; } ?>
    </div>
  </div>
<?php } ?>
```

**Tables Used:**
- `testimonials` - User testimonials

**Query Structure:**
```sql
SELECT * FROM testimonials ORDER BY id DESC LIMIT 4;
```

**Table Schema:**
```sql
CREATE TABLE testimonials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  designation VARCHAR(255),
  image VARCHAR(255),
  testimonial TEXT,
  rating INT(1),           -- 1-5 star rating
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. DATABASE TABLES & QUERY STRUCTURES

### **📊 Complete Table Summary**

| # | Table Name | Purpose | Used In Section |
|---|------------|---------|-----------------|
| 1 | `users` | User authentication & profiles | Header, Profile Modal |
| 2 | `group` | Logo and branding | Header |
| 3 | `group_create` | App categories (My Apps, My Company, etc.) | Sections 2, 4, 6, 7 |
| 4 | `create_details` | App icons, URLs, details | Sections 2, 4, 6, 7 |
| 5 | `social_link` | Social media URLs | Header, Footer |
| 6 | `copy_rights` | Copyright text | Footer |
| 7 | `about` | About Us content with images | Section 3 |
| 8 | `main_ads` | Main page advertisements (3 slots) | Section 5 |
| 9 | `newsroom` | Newsroom content | Section 8 |
| 10 | `awards` | Awards content | Section 8 |
| 11 | `events` | Events content | Section 8 |
| 12 | `gallery_images_master` | Gallery images | Section 8 |
| 13 | `testimonials` | User testimonials | Section 10 |

---

### **🔍 Detailed Query Structures**

#### **Query 1: Get Logo Image**

**Model Method:** `Admin_model::get_logo_image()`

```sql
SELECT * FROM `group`;
```

**Returns:** Single row with logo and branding information

**Table Schema:**
```sql
CREATE TABLE `group` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name_image VARCHAR(255),    -- Logo image path
  logo VARCHAR(255),          -- Icon logo path
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **Query 2: Get Top Navigation Icon List**

**Model Method:** `Admin_model::get_topnav_icon_list()`

**Returns:** Array with 4 keys: `myapps`, `myCompany`, `online`, `offline`

```sql
-- My Apps
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Apps'
ORDER BY gc.id;

-- My Company
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Company'
ORDER BY gc.id;

-- My Online Apps
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Onine Apps'
ORDER BY gc.id;

-- My Offline Apps
SELECT gc.name, cd.*
FROM group_create gc
JOIN create_details cd ON gc.id = cd.create_id
WHERE gc.apps_name = 'My Offline Apps'
ORDER BY gc.id;
```

**Table Schemas:**
```sql
CREATE TABLE group_create (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),          -- App category name
  apps_name VARCHAR(255),     -- Category type (My Apps, My Company, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE create_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  create_id INT,              -- FK to group_create.id
  name VARCHAR(255),          -- App name
  icon VARCHAR(255),          -- App icon path
  url VARCHAR(255),           -- App URL
  description TEXT,
  status TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (create_id) REFERENCES group_create(id)
);
```

---

#### **Query 3: Get Group Details by Name**

**Model Method:** `Home_model::get_group_name_detailsbyname($groupname)`

```sql
SELECT * FROM group_create WHERE name = 'Mygroup';
```

**Returns:** Single row with group details

---

#### **Query 4: Get Social Links**

**Model Method:** `Admin_model::get_social_link($group_id)`

```sql
SELECT * FROM social_link WHERE group_id = ?;
```

**Table Schema:**
```sql
CREATE TABLE social_link (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT,
  platform VARCHAR(50),       -- youtube, facebook, instagram, twitter, linkedin, website, blog
  url VARCHAR(255),
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Social Link Order:**
- Index 0: YouTube
- Index 1: Facebook
- Index 2: Instagram
- Index 3: Twitter
- Index 4: LinkedIn
- Index 5: Website
- Index 6: Blog

---

#### **Query 5: Get Copyright**

**Model Method:** `Admin_model::get_copy_right()`

```sql
SELECT * FROM copy_rights;
```

**Table Schema:**
```sql
CREATE TABLE copy_rights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  text TEXT,
  year INT,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **Query 6: Get About Us Content**

**Model Method:** `Admin_model::get_about_all($groupId)`

```sql
SELECT * FROM about WHERE group_id = 0;
```

**Table Schema:**
```sql
CREATE TABLE about (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT,
  title VARCHAR(255),
  content TEXT,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **Query 7: Get Main Ads**

**Model Method:** `Admin_model::main_ads_group()`

```sql
SELECT mn.id, mn.ads1, mn.ads2, mn.ads3,
       mn.ads1_url, mn.ads2_url, mn.ads3_url
FROM main_ads mn;
```

**Returns:** Single row with 3 ad slots

---

#### **Query 8: Get Latest Newsroom**

**Model Method:** `Admin_model::get_newsroom_latest_data()`

```sql
SELECT * FROM newsroom ORDER BY id DESC LIMIT 1;
```

**Table Schema:**
```sql
CREATE TABLE newsroom (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  description TEXT,
  image VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **Query 9: Get Latest Awards**

**Model Method:** `Admin_model::get_awards_latest_data()`

```sql
SELECT * FROM awards ORDER BY id DESC LIMIT 1;
```

**Table Schema:**
```sql
CREATE TABLE awards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  description TEXT,
  image VARCHAR(255),
  content TEXT,
  award_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **Query 10: Get Latest Events**

**Model Method:** `Admin_model::get_events_latest_data()`

```sql
SELECT * FROM events ORDER BY id DESC LIMIT 1;
```

**Table Schema:**
```sql
CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  description TEXT,
  image VARCHAR(255),
  content TEXT,
  event_date DATE,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **Query 11: Get Latest Gallery**

**Model Method:** `Admin_model::get_gallery_latest_data()`

```sql
SELECT * FROM gallery_images_master ORDER BY image_id DESC LIMIT 1;
```

**Table Schema:**
```sql
CREATE TABLE gallery_images_master (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_id INT,
  image_name VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **Query 12: Get Testimonials**

**Model Method:** `Admin_model::get_testimonials_data()`

```sql
SELECT * FROM testimonials ORDER BY id DESC LIMIT 4;
```

---

## 5. DATA FLOW & DISPLAY METHODS

### **📊 Data Loading Flow**

```
Home Controller (index method)
    ↓
Load 13 Data Sets from Models
    ↓
Pass to Template View
    ↓
Mobile Detection (isMobile())
    ↓
Load header_mobile.php + index_mobile.php
    ↓
Render 10 Layout Sections
```

### **🔄 Complete Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    Home::index()                            │
│                                                             │
│  1. get_logo_image()              → $data['logo']          │
│  2. get_topnav_icon_list()        → $data['top_icon']      │
│  3. get_bodynav_icon_list()       → $data['body_content']  │
│  4. get_group_name_detailsbyname()→ $data['group_details'] │
│  5. get_social_link()             → $data['social_link']   │
│  6. get_copy_right()              → $data['copy_right']    │
│  7. get_about_all()               → $data['about_us']      │
│  8. main_ads_group()              → $data['main_ads']      │
│  9. get_newsroom_latest_data()    → $data['newsroom']      │
│ 10. get_awards_latest_data()      → $data['awards']        │
│ 11. get_events_latest_data()      → $data['event']         │
│ 12. get_gallery_latest_data()     → $data['gallery']       │
│ 13. get_testimonials_data()       → $data['testimonials']  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              template.php (Mobile Detection)                │
│                                                             │
│  if (isMobile()) {                                          │
│    load header_mobile.php                                   │
│  } else {                                                   │
│    load header.php                                          │
│  }                                                          │
│  load $main_content (index_mobile.php)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  index_mobile.php                           │
│                                                             │
│  Section 1: My Apps          → $top_icon['myapps']         │
│  Section 2: About Us         → $about_us                   │
│  Section 3: My Company       → $top_icon['myCompany']      │
│  Section 4: Main Ads         → $main_ads                   │
│  Section 5: Online Apps      → $top_icon['online']         │
│  Section 6: Offline Apps     → $top_icon['offline']        │
│  Section 7: Footer Content   → $newsroom, $awards, etc.    │
│  Section 8: Navigation       → Static buttons              │
│  Section 9: Testimonials     → $testimonials               │
└─────────────────────────────────────────────────────────────┘
```

---

### **🎨 Display Methods by Section**

#### **Method 1: Carousel Display**

**Used In:** About Us, Main Ads, Footer Content, Testimonials

**Pattern:**
```php
<div id="carouselId" class="carousel slide" data-ride="carousel">
  <ol class="carousel-indicators">
    <!-- Dynamic indicators -->
  </ol>
  <div class="carousel-inner">
    <?php foreach ($data as $key => $item) { ?>
      <div class="carousel-item <?php if($key == 0) echo 'active' ?>">
        <!-- Content -->
      </div>
    <?php } ?>
  </div>
  <a class="carousel-control-prev" href="#carouselId" data-slide="prev">
    <span class="carousel-control-prev-icon"></span>
  </a>
  <a class="carousel-control-next" href="#carouselId" data-slide="next">
    <span class="carousel-control-next-icon"></span>
  </a>
</div>
```

**Bootstrap Carousel Settings:**
- Auto-play: Enabled
- Interval: 5000ms (default)
- Pause on hover: Yes
- Wrap: Yes (infinite loop)

---

#### **Method 2: Grid Display**

**Used In:** My Company, Online Apps, Offline Apps

**Pattern:**
```php
<div class="container">
  <div class="row">
    <?php foreach ($apps as $app) { ?>
      <div class="col-6">
        <a href="<?php echo site_url('group/'.$app->name) ?>">
          <img style="width: 50px; border-radius: 50%;"
               src="<?php echo base_url().$app->icon ?>">
          <p><?php echo $app->name ?></p>
        </a>
      </div>
    <?php } ?>
  </div>
</div>
```

**Grid Layout:**
- 2 columns (col-6)
- Responsive breakpoints
- Equal height items
- Centered content

---

#### **Method 3: Vertical Button List**

**Used In:** My Apps Section

**Pattern:**
```php
<div class="flex-col-c">
  <?php foreach ($apps as $app) { ?>
    <a class="flex-c-m s1-txt2 size3 how-btn"
       href="<?php echo site_url('group/'.$app->name) ?>">
      <img style="width: 20px;" src="<?php echo base_url().$app->icon ?>">
      &nbsp;&nbsp;<?php echo $app->name ?>
    </a>
  <?php } ?>
</div>
```

**Button Styling:**
- Full width
- Transparent background
- White border (2px)
- Border-radius: 25px
- Icon + Text layout
- Margin-bottom: 15px

---

#### **Method 4: File Manager Integration**

**Used In:** All image displays

**Pattern:**
```php
<?php echo $this->filemanager->getFilePath($image_path) ?>
```

**File Manager Methods:**
- `getFilePath($path)` - Returns full URL (AWS S3/Wasabi or local)
- Handles both cloud storage and local files
- Automatic CDN URL generation

---

### **🎯 Mobile-Specific Features**

#### **1. Dark/Light Mode Toggle**

**Implementation:**
```php
<?php $switchMode = $this->session->userdata('switch_mode'); ?>
<body class="<?php if($switchMode == 1) echo 'dark-mode' ?>">

<i onclick="dark_light_mode()" id="darMode"
   class="fa <?php echo ($switchMode) ? 'fa-sun-o' : 'fa-adjust' ?>"></i>
```

**JavaScript:**
```javascript
function dark_light_mode() {
  $.ajax({
    url: '<?php echo site_url('home/toggle_dark_mode'); ?>',
    type: 'post',
    success: function(data) {
      location.reload();
    }
  });
}
```

---

#### **2. User Profile Modal**

**Modal Sections:**
- Profile Picture (with camera upload)
- User ID display
- Profile/Personal/Address/Billing tabs
- Settings (Security, Language, Currency, Password)
- Legal (Terms & Conditions, Privacy Policy)
- Help & Support (Feedback, Live Chat, Contact)
- Share App / Download Apps
- Reviews and Ratings
- Logout
- Social Media Links
- Total Users (Global/National/Regional/Local)

---

#### **3. Location-Based User Count**

**AJAX Call:**
```javascript
function get_location_wise_total_users() {
  $.ajax({
    url: '<?php echo site_url('home/get_location_wise_data') ?>',
    type: 'post',
    success: function(result) {
      var data = $.parseJSON(result);
      $('#globalUser').html(data.global.globalCount);
      $('#nationalUser').html(data.national.natioanlCount);
      $('#regionalUser').html(data.regional.regionalCount);
      $('#localUser').html(data.local.localCount);
    }
  });
}
```

---

## 6. REACT TYPESCRIPT IMPLEMENTATION GUIDE

### **🎯 Technology Stack**

**Frontend:**
- React 18+ with TypeScript 5+
- Vite build tool
- React Router v6
- React Query for data fetching
- Tailwind CSS + shadcn/ui
- Swiper.js for carousels
- Framer Motion for animations

**Backend API:**
- Node.js 20 LTS + Express.js 4.x
- Sequelize 6.x ORM
- MySQL 8.0
- JWT authentication
- AWS S3 SDK

---

### **📁 React Component Structure**

```
src/
├── pages/mobile/Home/
│   ├── index.tsx
│   ├── sections/
│   │   ├── MyAppsSection.tsx
│   │   ├── AboutUsCarousel.tsx
│   │   ├── MyCompanySection.tsx
│   │   ├── MainAdsCarousel.tsx
│   │   ├── OnlineAppsSection.tsx
│   │   ├── OfflineAppsSection.tsx
│   │   ├── FooterCarousel.tsx
│   │   ├── NavigationButtons.tsx
│   │   └── TestimonialsCarousel.tsx
│   └── hooks/useHomeData.ts
├── components/mobile/
│   ├── Header/MobileHeader.tsx
│   ├── Modals/ProfileModal.tsx
│   └── common/AppIcon.tsx
├── services/api/homeApi.ts
└── types/home.types.ts
```

---

### **📝 TypeScript Interfaces**

```typescript
// types/home.types.ts

export interface AppDetails {
  id: number;
  create_id: number;
  name: string;
  icon: string;
  url: string;
  description: string;
  status: number;
}

export interface TopIconList {
  myapps: AppDetails[];
  myCompany: AppDetails[];
  online: AppDetails[];
  offline: AppDetails[];
}

export interface MainAds {
  id: number;
  ads1: string;
  ads2: string;
  ads3: string;
  ads1_url: string;
  ads2_url: string;
  ads3_url: string;
}

export interface Testimonial {
  id: number;
  name: string;
  designation: string;
  image: string;
  testimonial: string;
  rating: number;
}

export interface HomeData {
  logo: Logo;
  topIcon: TopIconList;
  socialLink: SocialLink[];
  aboutUs: AboutUs[];
  mainAds: MainAds;
  newsroom: Newsroom;
  awards: Awards;
  event: Events;
  gallery: Gallery;
  testimonials: Testimonial[];
}
```

---

### **🔌 API Endpoints**

```typescript
// services/api/homeApi.ts

export const homeApi = {
  // GET /api/home/mobile-data
  getMobileHomeData: async (): Promise<HomeData> => {
    const response = await axios.get('/api/home/mobile-data');
    return response.data;
  },

  // GET /api/apps/categories
  getAppCategories: async (): Promise<TopIconList> => {
    const response = await axios.get('/api/apps/categories');
    return response.data;
  },

  // GET /api/content/about
  getAboutUs: async (groupId: number): Promise<AboutUs[]> => {
    const response = await axios.get(`/api/content/about/${groupId}`);
    return response.data;
  },

  // GET /api/ads/main
  getMainAds: async (): Promise<MainAds> => {
    const response = await axios.get('/api/ads/main');
    return response.data;
  },

  // GET /api/content/latest
  getLatestContent: async (): Promise<{
    newsroom: Newsroom;
    awards: Awards;
    events: Events;
    gallery: Gallery;
  }> => {
    const response = await axios.get('/api/content/latest');
    return response.data;
  },

  // GET /api/testimonials
  getTestimonials: async (): Promise<Testimonial[]> => {
    const response = await axios.get('/api/testimonials?limit=4');
    return response.data;
  },
};
```

---

### **🎨 Example Component: MyAppsSection**

```typescript
// pages/mobile/Home/sections/MyAppsSection.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { AppDetails } from '@/types/home.types';

interface MyAppsSectionProps {
  apps: AppDetails[];
}

export const MyAppsSection: React.FC<MyAppsSectionProps> = ({ apps }) => {
  return (
    <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600
                    min-h-screen flex flex-col items-center justify-center
                    px-4 py-12">
      <div className="flex flex-col gap-4 w-full max-w-md">
        {apps.map((app) => (
          <Link
            key={app.id}
            to={`/group/${app.name}`}
            className="flex items-center justify-center gap-3
                       bg-transparent border-2 border-white rounded-full
                       py-3 px-6 text-white font-medium
                       hover:bg-white hover:text-purple-600
                       transition-all duration-300"
          >
            <img
              src={app.icon}
              alt={app.name}
              className="w-5 h-5 object-contain"
            />
            <span>{app.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
```

---

### **🎠 Example Component: AboutUsCarousel**

```typescript
// pages/mobile/Home/sections/AboutUsCarousel.tsx

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { AboutUs } from '@/types/home.types';
import 'swiper/css';
import 'swiper/css/pagination';

interface AboutUsCarouselProps {
  aboutData: AboutUs[];
}

export const AboutUsCarousel: React.FC<AboutUsCarouselProps> = ({ aboutData }) => {
  if (!aboutData || aboutData.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={true}
        className="about-carousel"
      >
        {aboutData.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="flex flex-col items-center text-center">
              <img
                src={item.image}
                alt={item.title}
                className="w-1/2 mx-auto mb-4 rounded-lg"
              />
              <div
                className="text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
```

---

### **🪝 Custom Hook: useHomeData**

```typescript
// pages/mobile/Home/hooks/useHomeData.ts

import { useQuery } from '@tanstack/react-query';
import { homeApi } from '@/services/api/homeApi';

export const useHomeData = () => {
  return useQuery({
    queryKey: ['mobileHomeData'],
    queryFn: homeApi.getMobileHomeData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

---

### **📱 Main Mobile Home Page**

```typescript
// pages/mobile/Home/index.tsx

import React from 'react';
import { useHomeData } from './hooks/useHomeData';
import { MobileHeader } from '@/components/mobile/Header/MobileHeader';
import { MyAppsSection } from './sections/MyAppsSection';
import { AboutUsCarousel } from './sections/AboutUsCarousel';
import { MyCompanySection } from './sections/MyCompanySection';
import { MainAdsCarousel } from './sections/MainAdsCarousel';
import { OnlineAppsSection } from './sections/OnlineAppsSection';
import { OfflineAppsSection } from './sections/OfflineAppsSection';
import { FooterCarousel } from './sections/FooterCarousel';
import { NavigationButtons } from './sections/NavigationButtons';
import { TestimonialsCarousel } from './sections/TestimonialsCarousel';

export const MobileHomePage: React.FC = () => {
  const { data, isLoading, error } = useHomeData();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  if (!data) return null;

  return (
    <div className="mobile-home">
      <MobileHeader
        logo={data.logo}
        socialLinks={data.socialLink}
      />

      <MyAppsSection apps={data.topIcon.myapps} />
      <AboutUsCarousel aboutData={data.aboutUs} />
      <MyCompanySection apps={data.topIcon.myCompany} />
      <MainAdsCarousel ads={data.mainAds} />
      <OnlineAppsSection apps={data.topIcon.online} />
      <OfflineAppsSection apps={data.topIcon.offline} />
      <FooterCarousel
        newsroom={data.newsroom}
        awards={data.awards}
        event={data.event}
        gallery={data.gallery}
      />
      <NavigationButtons />
      <TestimonialsCarousel testimonials={data.testimonials} />
    </div>
  );
};
```

---

## 📊 FINAL SUMMARY

### **Layout Sections Summary**

| Section | Component | Data Source | Display Method | Tables Used |
|---------|-----------|-------------|----------------|-------------|
| 1. Header | MobileHeader | get_logo_image() | Fixed navbar | users, group, social_link |
| 2. My Apps | MyAppsSection | get_topnav_icon_list() | Vertical buttons | group_create, create_details |
| 3. About Us | AboutUsCarousel | get_about_all() | Carousel | about |
| 4. My Company | MyCompanySection | get_topnav_icon_list() | 2-col grid | group_create, create_details |
| 5. Main Ads | MainAdsCarousel | main_ads_group() | Carousel | main_ads |
| 6. Online Apps | OnlineAppsSection | get_topnav_icon_list() | 2-col grid | group_create, create_details |
| 7. Offline Apps | OfflineAppsSection | get_topnav_icon_list() | 2-col grid | group_create, create_details |
| 8. Footer Content | FooterCarousel | get_*_latest_data() | Carousel | newsroom, awards, events, gallery_images_master |
| 9. Navigation | NavigationButtons | Static | Button list | - |
| 10. Testimonials | TestimonialsCarousel | get_testimonials_data() | Carousel | testimonials |

---

### **Database Tables Summary**

**Total Tables:** 13

1. `users` - User authentication
2. `group` - Logo and branding
3. `group_create` - App categories
4. `create_details` - App details
5. `social_link` - Social media
6. `copy_rights` - Copyright
7. `about` - About Us content
8. `main_ads` - Main advertisements
9. `newsroom` - Newsroom content
10. `awards` - Awards content
11. `events` - Events content
12. `gallery_images_master` - Gallery images
13. `testimonials` - User testimonials

---

### **API Endpoints Summary**

**Total Endpoints:** 7

1. `GET /api/home/mobile-data` - All home data
2. `GET /api/apps/categories` - App categories
3. `GET /api/content/about/:groupId` - About Us
4. `GET /api/ads/main` - Main ads
5. `GET /api/content/latest` - Latest content
6. `GET /api/testimonials` - Testimonials
7. `POST /api/user/toggle-dark-mode` - Dark mode

---

### **React Components Summary**

**Total Components:** 15+

- 1 Main page component
- 9 Section components
- 3 Header components
- 2 Modal components
- 1+ Common components

---

**✅ DOCUMENTATION COMPLETE!**

This document provides a complete reference for implementing the mobile home page in React TypeScript, including all layout sections, database queries, display methods, and implementation examples.

