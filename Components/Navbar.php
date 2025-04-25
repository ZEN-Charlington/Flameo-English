<?php
$currentPage = basename($_SERVER['PHP_SELF']);
?>

<nav class="header">
    <div class="logo_section" onclick="document.location='../components/Index.php'">
        <img class="FlameoLogo" src="../assets/FlameoLogo.png">
    </div>
    <div class="middle_section">
        <form method="post" action="../Pages/Review.php">
            <button class="logo-item <?= $currentPage == 'Review.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="review"
                    <?= $currentPage == 'Review.php' ? 'disabled' : '' ?>>
                <img class="ReviewLogo" src="../assets/HeaderReviewIcon.png">
                <p>Ôn tập</p>
            </button>   
        </form>
        <form method="post" action="../Pages/Learn.php">
            <button class="logo-item <?= $currentPage == 'Learn.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="learn"
                    <?= $currentPage == 'Learn.php' ? 'disabled' : '' ?>>
                <img class="LearnLogo" src="../assets/HeaderLearnIcon.png">
                <p>Học từ mới</p>
            </button>
        </form>
        <form method="post" action="../Pages/Notebook.php">
            <button class="logo-item <?= $currentPage == 'Notebook.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="notebook"
                    <?= $currentPage == 'Notebook.php' ? 'disabled' : '' ?>>
                <img class="NotebookLogo" src="../assets/HeaderNotebookIcon.png">
                <p>Sổ tay</p>
            </button>
        </form>
        <form method="post" action="../Pages/Progress.php">
            <button class="logo-item <?= $currentPage == 'Progress.php' ? 'active' : '' ?>" 
                    type="submit" name="page" value="progress"
                    <?= $currentPage == 'Progress.php' ? 'disabled' : '' ?>>
                <img class="ProgressLogo" src="../assets/HeaderProgressIcon.png">
                <p>Tiến độ</p>
            </button>
        </form>
    </div>
    <div class="right_section">
        <p>Welcome To Flameo!</p>
        <img class="avatar" src="../assets/AppAvatar.png">
    </div>
</nav>
