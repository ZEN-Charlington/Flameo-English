<?php
$currentPage = basename($_SERVER['PHP_SELF']);
$base_url = "/frontend"; // Base URL để chuẩn hóa đường dẫn
?>

<nav class="header">
    <div class="logo_section" onclick="document.location='<?php echo $base_url; ?>/index.php'">
        <img class="FlameoLogo" src="<?php echo $base_url; ?>/assets/FlameoLogo.png">
    </div>
    <div class="middle_section">
        <form method="post" action="<?php echo $base_url; ?>/Pages/Review.php">
            <button class="logo-item <?= $currentPage == 'Review.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="review"
                    <?= $currentPage == 'Review.php' ? 'disabled' : '' ?>>
                <img class="ReviewLogo" src="<?php echo $base_url; ?>/assets/HeaderReviewIcon.png">
                <p>Ôn tập</p>
            </button>   
        </form>
        <form method="post" action="<?php echo $base_url; ?>/Pages/Learn.php">
            <button class="logo-item <?= $currentPage == 'Learn.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="learn"
                    <?= $currentPage == 'Learn.php' ? 'disabled' : '' ?>>
                <img class="LearnLogo" src="<?php echo $base_url; ?>/assets/HeaderLearnIcon.png">
                <p>Học từ mới</p>
            </button>
        </form>
        <form method="post" action="<?php echo $base_url; ?>/Pages/Notebook.php">
            <button class="logo-item <?= $currentPage == 'Notebook.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="notebook"
                    <?= $currentPage == 'Notebook.php' ? 'disabled' : '' ?>>
                <img class="NotebookLogo" src="<?php echo $base_url; ?>/assets/HeaderNotebookIcon.png">
                <p>Sổ tay</p>
            </button>
        </form>
        <form method="post" action="<?php echo $base_url; ?>/Pages/Progress.php">
            <button class="logo-item <?= $currentPage == 'Progress.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="progress"
                    <?= $currentPage == 'Progress.php' ? 'disabled' : '' ?>>
                <img class="ProgressLogo" src="<?php echo $base_url; ?>/assets/HeaderProgressIcon.png">
                <p>Tiến độ</p>
            </button>
        </form>
    </div>
    <div class="right_section" id="user-section">
        <img class="avatar" src="<?php echo $base_url; ?>/assets/AppAvatar.png">
    </div>
</nav>
<link rel="stylesheet" href="<?php echo $base_url; ?>../Style/auth-navbar.css">
<link rel="stylesheet" href="<?php echo $base_url; ?>../Style/transition.css">
<script src="<?php echo $base_url; ?>./js/navbar-auth.js"></script>
<script src="<?php echo $base_url; ?>./js/common.js"></script>