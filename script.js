let books = [];
let currentUser = null;

async function displayBooks() {
    try {
        const response = await fetch('http://localhost:3000/api/books');
        const data = await response.json();
        books = data.map(book => book.title);

        let list = document.getElementById("bookList");
        list.innerHTML = "";

        books.forEach(book => {
            let li = document.createElement("li");
            li.textContent = book;
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        alert('Error loading books. Make sure the backend server is running.');
    }
}

async function login() {
    let username = document.getElementById("username").value;
    if (!username) {
        alert("Please enter a username");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.ok) {
            currentUser = username;
            alert("Welcome " + username);
            displayBooks(); // Refresh book list after login
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Error logging in. Make sure the backend server is running.');
    }
}

async function issueBook() {
    if (!currentUser) {
        alert("Please login first");
        return;
    }

    let bookTitle = document.getElementById("bookName").value;
    if (!bookTitle) {
        alert("Please enter a book name");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: currentUser, bookTitle })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            displayBooks(); // Refresh book list after issuing
        } else {
            alert(data.error || 'Failed to issue book');
        }
    } catch (error) {
        console.error('Error issuing book:', error);
        alert('Error issuing book. Make sure the backend server is running.');
    }
}

// Initial load
displayBooks();