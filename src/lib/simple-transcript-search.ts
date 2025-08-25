// Simple transcript search without file system dependencies
// This works in Vercel's edge runtime

interface TranscriptChunk {
  content: string;
  course: 'nodejs' | 'python';
  section: string;
  videoId: string;
  timestamp: string;
  startTime: number;
  score?: number; // Added for search scoring
}

// Pre-processed transcript data that will be included in the bundle
const transcriptData: TranscriptChunk[] = [
  // Node.js Fundamentals
  {
    content: "Hey everyone and welcome to an exciting new course on Node js. In this particular course we are going to learn Node js from the very basic and we will go to the advance as well.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '01-node-introduction',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "So what is Node js? Node js is basically a JavaScript runtime environment that allows you to run JavaScript code outside of a web browser.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '01-node-introduction',
    timestamp: '0:15',
    startTime: 15
  },
  {
    content: "Node.js uses Chrome's V8 JavaScript engine to execute JavaScript code on the server side. This means you can build server-side applications using JavaScript.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '01-node-introduction',
    timestamp: '0:30',
    startTime: 30
  },
  {
    content: "To install Node.js, go to nodejs.org and download the LTS version. LTS stands for Long Term Support and is recommended for production use.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '02-nodejs-install',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "After installation, you can verify Node.js is working by opening terminal or command prompt and typing 'node --version'. This should show you the installed version.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '02-nodejs-install',
    timestamp: '0:25',
    startTime: 25
  },
  {
    content: "Let's create our first Node.js application. Create a new file called hello.js and write console.log('Hello World'). Then run it using 'node hello.js' command.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '03-hello-world',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "The main difference between Node.js and browser is that in Node.js we don't have access to DOM, window object, or browser APIs. Instead, we have access to file system, network, and other server-side APIs.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '04-node-vs-browser',
    timestamp: '0:10',
    startTime: 10
  },
  {
    content: "Node.js has a built-in module system. You can import modules using require() function. For example, const fs = require('fs') imports the file system module.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '05-node-modules',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "To install third-party modules, use npm (Node Package Manager). Run 'npm init' to create package.json file, then 'npm install package-name' to install packages.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '06-node-third-party-modules',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "The fs module allows you to work with file system. You can read files using fs.readFile() or fs.readFileSync(). The Sync version blocks execution while async version doesn't.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '07-node-fs-module',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "HTTP module in Node.js allows you to create web servers. Use require('http') to import it, then createServer() method to create a server that listens for requests.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '10-node-http',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "HTTP status codes indicate the result of HTTP requests. 200 means success, 404 means not found, 500 means server error. Different HTTP methods include GET, POST, PUT, DELETE.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '11-node-http-statuc-codes-methods',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Express.js is a popular Node.js framework that simplifies building web applications. Install it with 'npm install express', then create an app using express() function.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '17-node-express-1',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Express routes define how an application responds to client requests. Use app.get(), app.post(), app.put(), app.delete() to handle different HTTP methods.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '18-node-express-2',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Express middleware functions execute during request-response cycle. They can modify request/response objects, end cycles, or call next middleware using next() function.",
    course: 'nodejs',
    section: 'Fundamentals',
    videoId: '23-node-express-middlewares',
    timestamp: '0:00',
    startTime: 0
  },
  
  // Node.js Authentication
  {
    content: "Authentication verifies who you are (like showing ID), while Authorization determines what you can do (like having permissions). They work together for security.",
    course: 'nodejs',
    section: 'Authentication',
    videoId: '01-authentication-vs-authorization',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Session-based authentication stores user data on the server. When user logs in, server creates session and sends session ID to client via cookie.",
    course: 'nodejs',
    section: 'Authentication',
    videoId: '03-session-based-auth',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "JSON Web Tokens (JWT) are stateless authentication method. Token contains encoded user information and can be verified without storing session data on server.",
    course: 'nodejs',
    section: 'Authentication',
    videoId: '06-stateless-auth-jwt',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Express middleware for authentication checks if user is logged in before allowing access to protected routes. Use req.session or verify JWT tokens.",
    course: 'nodejs',
    section: 'Authentication',
    videoId: '05-auth-express-middleware',
    timestamp: '0:00',
    startTime: 0
  },
  
  // Python Fundamentals
  {
    content: "Python is a high-level, interpreted programming language known for its simple syntax and readability. It's great for beginners and powerful for experts.",
    course: 'python',
    section: 'Introduction',
    videoId: '03-what-is-programming',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Python is widely used for web development, data science, artificial intelligence, automation, and scientific computing. Its versatility makes it very popular.",
    course: 'python',
    section: 'Introduction',
    videoId: '06-why-python',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "To write your first Python code, create a .py file and use print() function. For example: print('Hello World'). Run it with 'python filename.py' command.",
    course: 'python',
    section: 'Introduction',
    videoId: '07-first-python-code-mac',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Virtual environments isolate Python projects and their dependencies. Use 'python -m venv myenv' to create and 'source myenv/bin/activate' to activate virtual environment.",
    course: 'python',
    section: 'Introduction',
    videoId: '09-virtual-environment',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Python objects are either mutable (can be changed) or immutable (cannot be changed). Lists and dictionaries are mutable, while strings and tuples are immutable.",
    course: 'python',
    section: 'Data Types',
    videoId: '01-mutable-immutable-objects',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Python supports different number types: integers (int), floating-point numbers (float), and complex numbers. You can perform arithmetic operations on all number types.",
    course: 'python',
    section: 'Data Types',
    videoId: '02-numbers-in-depth',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Strings in Python are sequences of characters. Use indexing string[0] to access characters, slicing string[1:4] for substrings. Strings are immutable.",
    course: 'python',
    section: 'Data Types',
    videoId: '03-string-index-slice',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Lists in Python are ordered, mutable collections. Create with square brackets: [1, 2, 3]. Use append(), remove(), and other methods to modify lists.",
    course: 'python',
    section: 'Data Types',
    videoId: '05-lists-basics',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Dictionaries store key-value pairs. Create with curly braces: {'name': 'John', 'age': 30}. Access values using keys: dict['name'].",
    course: 'python',
    section: 'Data Types',
    videoId: '08-dictionary-python',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Python functions are defined with 'def' keyword. They can take parameters and return values. Use return statement to send data back from function.",
    course: 'python',
    section: 'Functions',
    videoId: '01-functions-intro',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Function scope determines where variables can be accessed. Local variables exist only inside functions, global variables exist throughout the program.",
    course: 'python',
    section: 'Functions',
    videoId: '03-scope-namespace',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Lambda functions are anonymous functions defined with lambda keyword. They're useful for short, simple functions. Example: lambda x: x * 2",
    course: 'python',
    section: 'Functions',
    videoId: '07-lambdas-pure-impure',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "List comprehensions provide concise way to create lists. Syntax: [expression for item in iterable]. Example: [x**2 for x in range(10)] creates list of squares.",
    course: 'python',
    section: 'Comprehensions',
    videoId: '02-list-comprehensions',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Python classes define object blueprints. Use 'class' keyword to create class, '__init__' method as constructor. Create objects by calling class like function.",
    course: 'python',
    section: 'OOP',
    videoId: '01-first-class-object',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Inheritance allows classes to inherit properties from parent classes. Use super() to access parent class methods. Method Resolution Order (MRO) determines method lookup.",
    course: 'python',
    section: 'OOP',
    videoId: '06-inheritance-composition',
    timestamp: '0:00',
    startTime: 0
  },
  {
    content: "Exception handling in Python uses try-except blocks. Put risky code in try block, handle errors in except block. Use finally for cleanup code that always runs.",
    course: 'python',
    section: 'Error Handling',
    videoId: '02-try-except-finally',
    timestamp: '0:00',
    startTime: 0
  }
];

// Simple text-based search function
export function searchTranscripts(
  query: string, 
  course: 'nodejs' | 'python' | 'both' = 'both',
  limit: number = 3
): TranscriptChunk[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  // Filter by course if specified
  const courseData = course === 'both' 
    ? transcriptData 
    : transcriptData.filter(item => item.course === course);
  
  // Score each chunk based on keyword matches
  const scored = courseData.map(chunk => {
    let score = 0;
    const content = chunk.content.toLowerCase();
    
    queryWords.forEach(word => {
      if (content.includes(word)) {
        score += 1;
        // Bonus for exact phrase matches
        if (query.toLowerCase().includes(word) && content.includes(word)) {
          score += 0.5;
        }
      }
    });
    
    return { ...chunk, score };
  });
  
  // Sort by score and return top results
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Format search results for the AI
export function formatTranscriptResults(results: TranscriptChunk[]): string {
  if (results.length === 0) {
    return "No relevant transcript content found for this query.";
  }
  
  return results.map((result, index) => 
    `## Reference ${index + 1}: ${result.course.toUpperCase()} - ${result.section} (${result.timestamp})
**Video**: ${result.videoId}
**Content**: ${result.content}`
  ).join('\n\n');
}