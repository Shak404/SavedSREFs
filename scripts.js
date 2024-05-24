document.addEventListener("DOMContentLoaded", function() {
    fetchImages();

    async function fetchImages() {
        try {
            const [imageResponse, tagsResponse] = await Promise.all([
                fetch('https://shak404.github.io/SavedSREFs/images'), // Corrected URL
                fetch('codes.txt')
            ]);
            if (!imageResponse.ok) throw new Error('Failed to fetch images: ' + imageResponse.status);
            if (!tagsResponse.ok) throw new Error('Failed to fetch tags: ' + tagsResponse.status);
            const imageData = await imageResponse.text();
            const tagData = await tagsResponse.text();
            const srefArray = parseImages(imageData);
            const tags = parseTags(tagData);
            renderImages(srefArray, tags);
        } catch (error) {
            console.error('Error fetching images or tags:', error);
        }
    }

    // Function to parse images from HTML response
    function parseImages(data) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const srefArray = {};
        Array.from(doc.querySelectorAll('a'))
            .map(link => link.innerText.trim())
            .filter(filename => filename !== '')
            .forEach(filename => {
                const [sref] = filename.split('-');
                if (!srefArray[sref]) srefArray[sref] = [];
                srefArray[sref].push(filename);});
        return srefArray;}

    // Function to parse tags from the text file
    function parseTags(data) {
        const tags = {};
        data.split('\n').forEach(line => {
            const [sref, tagString] = line.split(':');
            if (sref && tagString) {
                tags[sref.trim()] = tagString.split(',').map(tag => tag.trim());}});
        return tags;}

    // Function to render images and add tags as data attributes
    function renderImages(srefArray, tags) {
        const imageGrid = document.getElementById("imageGrid");
        let totalRows = 0;
        Object.keys(srefArray).sort((a, b) => parseInt(a) - parseInt(b)).forEach(sref => {
            const row = document.createElement("div");
            row.classList.add("row");
            // Create and append the sref label
            const srefLabel = document.createElement("div");
            srefLabel.classList.add("sref-label");
            srefLabel.textContent = sref;
            row.appendChild(srefLabel);
            // Attach tags as data attribute to the row
            if (tags[sref]) {
                row.dataset.tags = tags[sref].join(',');
                // Populate tag menu
                tags[sref].forEach(tag => addTagToMenu(tag));}
            // Create columns for different image types
            const portColumn = createColumn('portrait-column', srefArray[sref], 'port');
            const landColumn = createColumn('landscape-column', srefArray[sref], 'land');
            const fracColumn = createColumn('fractal-column', srefArray[sref], 'frac');
            // Append columns to the row
            row.appendChild(portColumn);
            row.appendChild(landColumn);
            row.appendChild(fracColumn);
            imageGrid.appendChild(row);
            totalRows++;});
        lazyLoadImages();
        const allTagsCount = document.getElementById("ALLTAGcount");
        allTagsCount.textContent = totalRows.toString();}

        // Function to add a tag to the menu if it doesn't already exist
        const tagCounts = {};
        function addTagToMenu(tag) {
            const tagMenu = document.getElementById("tagMenu");
            if (!tagMenu.querySelector(`button[data-tag="${tag}"]`)) {
                const button = document.createElement("button");
                button.classList.add("tag-button");
                button.dataset.tag = tag;
                button.textContent = tag;
                const countSpan = document.createElement("span");
                countSpan.classList.add("tag-count");
                countSpan.textContent = "0";
                button.appendChild(countSpan);
                button.addEventListener("click", toggleTag);
                tagMenu.appendChild(button);
                tagCounts[tag] = 0;}
            tagCounts[tag]++;
            const button = tagMenu.querySelector(`button[data-tag="${tag}"]`);
            const countSpan = button.querySelector(".tag-count");
            countSpan.textContent = tagCounts[tag].toString();}

// Make ALLTAG active on page load
const AllTags = document.getElementById("AllTags");
AllTags.classList.add("active");

function toggleTag(event) {
    const clickedTag = event.target;
    const allTagButton = document.getElementById("ALLTAG");
    allTagButton.addEventListener("click", toggleTag);
    let isActive;
    if (clickedTag.classList.contains("ALLTAG")) {
        // Check if AllTags container is already active
        isActive = document.getElementById("AllTags").classList.contains("active");
        if (!isActive) {
            // If AllTags container is not active, activate it and deactivate all other tags
            document.querySelectorAll('.tag-button').forEach(tag => tag.classList.remove("active"));
            document.getElementById("AllTags").classList.add("active");
            document.querySelectorAll('.row').forEach(row => {
                row.style.display = 'flex';});
            return;} 
        else {return;}} 
        else {// Toggle the active class on the clicked tag
                clickedTag.classList.toggle("active");
                isActive = document.getElementById("AllTags").classList.contains("active");
                // Deactivate the AllTags container if another tag is clicked
                document.getElementById("AllTags").classList.remove("active");
                // Update the activeTags array after toggling the class
                const activeTags = Array.from(document.querySelectorAll('#tagMenu .active')).map(tag => tag.dataset.tag);
                const rows = document.querySelectorAll('.row');
                rows.forEach(row => {
                    const tags = row.dataset.tags ? row.dataset.tags.split(',') : [];
                    const hasActiveTags = activeTags.length === 0 || tags.some(tag => activeTags.includes(tag));
                    row.style.display = hasActiveTags ? 'flex' : 'none';});
                // Check if no tags are active after toggling
                if (activeTags.length === 0) {
                    // If no tags are active, activate the ALLTAG
                    document.getElementById("AllTags").classList.add("active");}}}
                
// Helper function to create a column with images of a specific type
function createColumn(columnClass, filenames, type) {
    const column = document.createElement("div");
    column.classList.add("column", columnClass);
    filenames.filter(filename => filename.includes(`-${type}`)).forEach(filename => {
        const img = document.createElement("img");
        img.dataset.src = "images/" + filename; // Set data-src instead of src
        img.classList.add("image-item");
        column.appendChild(img);});
    return column;}

// Function to lazy load images using Intersection Observer
function lazyLoadImages() {
    const images = document.querySelectorAll('.image-item[data-src]');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; // Load the image
                img.removeAttribute('data-src'); // Remove data-src attribute
                observer.unobserve(img);}});});
    images.forEach(image => {
        observer.observe(image);});}});

// CopySrefCode event listener
document.getElementById('imageGrid').addEventListener('click', function(event) {
    let target = event.target;
    while (target && !target.classList.contains('row')) {
        target = target.parentElement;}
    if (target && target.classList.contains('row')) {
        var srefLabel = target.querySelector('.sref-label');
        if (srefLabel) {
            var srefValue = parseInt(srefLabel.textContent);
            navigator.clipboard.writeText(srefValue.toString())
                .then(function() {
                    console.log("Copied SrefCode to clipboard:", srefValue);
                    // Add a CSS class to change the style temporarily
                    srefLabel.classList.add('copied');
                    // Remove the CSS class after 2 seconds
                    setTimeout(function() {
                        srefLabel.classList.remove('copied');
                    }, 2000);})
                .catch(function(err) {
                    console.error('Failed to copy: ', err);});}}});

// TagsMenu
const tagMenu = document.getElementById("tagMenu");
const tagMenuTitle = document.getElementById("tagMenuTitle");
const menuArrowIcon = document.getElementById("menuArrowIcon");
function toggleTagMenu() {
    tagMenuTitle.classList.toggle("closed");
    menuArrowIcon.classList.toggle("closed");
    tagMenu.classList.toggle("closed");
    AllTags.classList.toggle("closed");}
    // Add event listener to close the menu on grid scroll
    tagMenu.classList.add("closed");
    tagMenuTitle.classList.add("closed");
    menuArrowIcon.classList.add("closed");
    AllTags.classList.add("closed");
    window.addEventListener('scroll', function () {
        if (!tagMenu.classList.contains("closed")) {
            tagMenu.classList.add("closed");
            tagMenuTitle.classList.add("closed");
            menuArrowIcon.classList.add("closed");
            AllTags.classList.toggle("closed");}});

// Back to top button visibility toggle
var backToTopButton = document.getElementById('backToTop');
window.addEventListener('scroll', function () {
    if (window.scrollY > 600) {
        backToTopButton.classList.add('show');} 
    else {backToTopButton.classList.remove('show');}});
// Smooth scroll back to top
backToTopButton.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });});

function handleColumnClick(type) {
        var title = document.querySelector("." + type + "-column-title");
        if (!title) {
            console.error("Column title not found for type:", type);
            return;}
        // Toggle collapsed class on title
        title.classList.toggle('collapsed');
        // Toggle collapsed class on images in the corresponding column
        var images = document.querySelectorAll("." + type + "-column .image-item");
        images.forEach(image => {
            image.classList.toggle('collapsed', title.classList.contains('collapsed'));});}

//DarkMode
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;
darkModeToggle.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');} 
    else {body.setAttribute('data-theme', 'dark');}});
