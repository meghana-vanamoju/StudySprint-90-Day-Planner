import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, BookOpen, Brain, CalendarDays,
  Check, CheckCheck, ChevronLeft, ChevronRight, CircleHelp, Clock3, Code2,
  Command, Download, ExternalLink, Flame, GraduationCap, LayoutDashboard,
  ListChecks, Menu, Plus, Search, Settings2, Target, Trash2, Trophy, X,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

type Task = { id: string; title: string; time: string; minutes: number; done: boolean; kind: string }
type Problem = { id: string; title: string; topic: string; difficulty: 'Easy'|'Medium'|'Hard'; url: string; status: 'Todo'|'Attempted'|'Solved'; date: string; notes: string }
type Course = { id: string; title: string; provider: string; url: string; total: number; completed: number; category: string }
type State = { startDate: string; selectedDay: number; tasks: Record<number, Task[]>; completedDays: number[]; problems: Problem[]; courses: Course[]; notes: Record<number,string>; dailyLog: Record<string,number> }
type DayPlan = { title: string; focus: string; tasks: string[]; secondary?: string }

const STORAGE_KEY = 'studysprint-90day-v1'
const initialCourses: Course[] = [
  { id:'python', title:'Python course', provider:'Udemy', url:'https://www.udemy.com/share/101W943@7MEQdcSpw5Ae3LPcQDmLXOZOYbEo9aGHWV3ylETnu7JntAHSpzBoIdIgXCXIMyu8Sw==/', total:30, completed:0, category:'Python' },
  { id:'mern', title:'MERN Stack course', provider:'Udemy', url:'https://www.udemy.com/share/106FLy3@dM3jAeZNBW82jMr1xQJg8GIsD_sQ1Dntz76z5pkfLrIKUxVRfJQoHS0CFAinOWY33w==/', total:50, completed:0, category:'Full stack' },
]
const risingBrain = 'https://risingbrain.org/sheet'
const whimsical = 'https://whimsical.com/dsa-patterns-47DQdVg8MiLZ1idPyveWFr'

const weeks: DayPlan[][] = [
  [
    {title:'Python basics & loops',focus:'Python foundations',tasks:['Revise variables, conditions and loops','Solve 1–2 number / loop problems','Write Big-O notes']},
    {title:'Functions, lists & strings',focus:'Python foundations',tasks:['Practice functions, lists and strings','Solve reverse string + palindrome','Write 3 edge cases']},
    {title:'Hash maps and sets',focus:'Python foundations',tasks:['Learn dict, set and frequency maps','Solve duplicate + frequency problems','Compare list, set and dict']},
    {title:'Array traversal',focus:'Arrays',tasks:['Learn array traversal and in-place updates','Solve largest + second-largest','Dry-run one solution']},
    {title:'Searching fundamentals',focus:'Searching',tasks:['Learn linear and binary search','Solve one easy search problem','Review errors from the week']},
    {title:'Big-O & sorting',focus:'Complexity',tasks:['Review O(1), O(log n), O(n), O(n²)','Implement linear/binary search','Solve 2 easy problems']},
    {title:'Weekly review',focus:'Revision',tasks:['Re-solve 2 missed problems','Take a 30-minute mini-test','Plan next week']},
  ],
  [
    {title:'Array operations',focus:'Arrays',tasks:['Review in-place array changes','Solve Move Zeroes','Solve Remove Duplicates from Sorted Array']},
    {title:'Two pointers',focus:'Two pointers',tasks:['Learn left/right pointer patterns','Solve Two Sum II','Explain pointer movement']},
    {title:'Fixed sliding window',focus:'Sliding window',tasks:['Learn fixed-size window updates','Solve Maximum Average Subarray I','Write window invariant']},
    {title:'Variable sliding window',focus:'Sliding window',tasks:['Learn expand/shrink logic','Solve Longest Substring Without Repeating Characters','Review edge cases']},
    {title:'Hashing patterns',focus:'Hashing',tasks:['Review frequency maps','Solve Contains Duplicate','Solve Valid Anagram']},
    {title:'Prefix sums & Kadane',focus:'Arrays',tasks:['Learn prefix sums and Kadane','Solve Find Pivot Index','Solve Maximum Subarray']},
    {title:'Arrays review',focus:'Revision',tasks:['Re-solve 3 earlier problems','Take a timed test','Update weak-pattern list']},
  ],
  [
    {title:'Binary search basics',focus:'Binary search',tasks:['Learn binary search boundaries','Solve Binary Search','Solve Search Insert Position']},
    {title:'Binary search variations',focus:'Binary search',tasks:['Practice first/last occurrence','Solve First and Last Position','Review rotated-array logic']},
    {title:'Linked-list fundamentals',focus:'Linked lists',tasks:['Draw node and pointer diagrams','Solve Reverse Linked List','Solve Middle of Linked List']},
    {title:'Fast and slow pointers',focus:'Linked lists',tasks:['Learn fast/slow pointer use cases','Solve Linked List Cycle','Solve Remove Nth Node From End']},
    {title:'Stacks and queues',focus:'Stacks',tasks:['Learn LIFO vs FIFO','Solve Valid Parentheses','Implement queue using stacks']},
    {title:'Monotonic stack & sorting',focus:'Stacks / sorting',tasks:['Learn monotonic stack','Solve Daily Temperatures','Implement merge sort']},
    {title:'Mixed review',focus:'Revision',tasks:['Choose 2 weak-topic problems','Revisit binary-search boundaries','Weekly test']},
  ],
  [
    {title:'Recursion basics',focus:'Recursion',tasks:['Learn base cases and call stack','Implement factorial and Fibonacci','Draw a recursion tree']},
    {title:'Divide and conquer',focus:'Recursion',tasks:['Review recursive binary search','Implement merge sort','Analyze complexity']},
    {title:'Backtracking: subsets',focus:'Backtracking',tasks:['Learn choose/explore/unchoose','Solve Subsets','Trace recursive choices']},
    {title:'Backtracking constraints',focus:'Backtracking',tasks:['Learn pruning','Solve Combination Sum','Try Generate Parentheses']},
    {title:'Greedy fundamentals',focus:'Greedy',tasks:['Learn greedy choice intuition','Solve Jump Game','Compare with brute force']},
    {title:'Month 1 mixed practice',focus:'Assessment',tasks:['Solve 2 mixed problems','Review all mistake notes','Take a timed mini-mock']},
    {title:'Month 1 checkpoint',focus:'Assessment',tasks:['Complete 3 problems without tutorials','Explain Big-O aloud','Choose Month 2 weak areas']},
  ],
  [
    {title:'Binary tree traversal',focus:'Trees',tasks:['Learn DFS traversals','Implement inorder/preorder/postorder','Solve Maximum Depth']},
    {title:'Tree height and paths',focus:'Trees',tasks:['Learn height, depth and recursion return values','Solve Diameter of Binary Tree','Trace a sample tree']},
    {title:'BFS / level order',focus:'Trees',tasks:['Learn queue-based BFS','Solve Binary Tree Level Order Traversal','Compare DFS and BFS']},
    {title:'Binary search trees',focus:'BST',tasks:['Learn BST invariants','Solve Search in BST','Solve Validate BST']},
    {title:'Heaps and priority queues',focus:'Heaps',tasks:['Learn min/max heap','Solve Kth Largest Element','Review heap operations']},
    {title:'Trees review + OOP intro',focus:'Trees / OOP',tasks:['Solve one tree problem','Start OOP: classes and objects','Practice one mixed question']},
    {title:'OOP foundations',focus:'OOP',tasks:['Learn encapsulation and constructors','Learn inheritance and polymorphism','Explain examples in Python']},
  ],
  [
    {title:'Graph representation',focus:'Graphs',tasks:['Learn adjacency list/matrix','Implement BFS and DFS','Solve Number of Islands']},
    {title:'Components and cycles',focus:'Graphs',tasks:['Learn connected components','Practice cycle detection','Solve a graph traversal problem']},
    {title:'Topological sorting',focus:'Graphs',tasks:['Learn indegree and Kahn algorithm','Solve Course Schedule','Explain directed acyclic graphs']},
    {title:'Shortest paths',focus:'Graphs',tasks:['Learn BFS shortest path and Dijkstra','Solve one shortest-path problem','Review non-negative weights']},
    {title:'Union-Find',focus:'Graphs',tasks:['Learn parent/rank/path compression','Solve Redundant Connection','Review MST intuition']},
    {title:'Graph review',focus:'Graphs',tasks:['Re-solve one graph problem','Draw graph traversal','Review complexity']},
    {title:'OOP deepening',focus:'OOP',tasks:['Learn abstraction and composition','Review SOLID at a high level','Practice OOP interview answers']},
  ],
  [
    {title:'DP intuition',focus:'Dynamic programming',tasks:['Learn overlapping subproblems','Solve Climbing Stairs','Write recursive + memoized versions']},
    {title:'1D dynamic programming',focus:'Dynamic programming',tasks:['Learn tabulation','Solve House Robber','Solve Min Cost Climbing Stairs']},
    {title:'Grid DP',focus:'Dynamic programming',tasks:['Learn state transitions in grids','Solve Unique Paths','Try Minimum Path Sum']},
    {title:'Knapsack / subset sum',focus:'Dynamic programming',tasks:['Learn choose/skip state','Solve Coin Change','Study Partition Equal Subset Sum']},
    {title:'String DP intro',focus:'Dynamic programming',tasks:['Learn 2D DP table','Solve Longest Common Subsequence','Trace table values']},
    {title:'DP review',focus:'Dynamic programming',tasks:['Re-solve 2 DP problems','Explain state, transition and base case','Review time/space trade-offs']},
    {title:'DBMS foundations',focus:'DBMS',tasks:['Learn ER models, keys and relationships','Study functional dependencies','Review 1NF, 2NF and 3NF']},
  ],
  [
    {title:'Greedy and intervals',focus:'Greedy',tasks:['Review interval sorting','Solve Non-overlapping Intervals','Explain greedy choice']},
    {title:'Bit manipulation',focus:'Bit manipulation',tasks:['Learn AND/OR/XOR and shifts','Solve Single Number','Solve Missing Number']},
    {title:'Tries',focus:'Tries',tasks:['Learn trie nodes and prefixes','Implement insert/search','Solve Implement Trie']},
    {title:'Mixed DSA practice',focus:'Revision',tasks:['Solve one array/hash problem','Solve one graph problem','Review mistakes']},
    {title:'DP and graph revision',focus:'Revision',tasks:['Solve one medium DP problem','Solve one graph problem','Review patterns']},
    {title:'SQL essentials',focus:'DBMS / SQL',tasks:['Learn SELECT, WHERE, GROUP BY, HAVING','Practice INNER/LEFT JOIN','Write 5 SQL queries']},
    {title:'DBMS checkpoint',focus:'DBMS / SQL',tasks:['Review ACID and transactions','Learn indexes and isolation','Practice subqueries']},
  ],
  [
    {title:'OSI and TCP/IP',focus:'Computer networks',tasks:['Learn OSI and TCP/IP models','Explain encapsulation','Review array/hashing pattern']},
    {title:'TCP, UDP and DNS',focus:'Computer networks',tasks:['Compare TCP and UDP','Learn ports and DNS resolution','Solve one two-pointer problem']},
    {title:'HTTP and HTTPS',focus:'Computer networks',tasks:['Learn methods, status codes and TLS','Review cookies vs sessions','Solve one sliding-window problem']},
    {title:'IP and routing',focus:'Computer networks',tasks:['Learn IP addressing and routing basics','Study subnetting concepts','Solve one binary-search problem']},
    {title:'Web security basics',focus:'Computer networks',tasks:['Review TLS and certificates','Learn cookies and session basics','Solve one linked-list/stack problem']},
    {title:'CN revision',focus:'Computer networks',tasks:['Explain OSI and TCP/IP aloud','Review DNS and HTTPS','Write a one-page summary']},
    {title:'Mixed DSA mock',focus:'Mock interview',tasks:['Take a 45-minute mixed test','Review every mistake','List top 3 weak patterns']},
  ],
  [
    {title:'Design requirements',focus:'System design',tasks:['Learn functional/non-functional requirements','Design a URL shortener at high level','Explain assumptions']},
    {title:'Client-server and APIs',focus:'System design',tasks:['Review client/server architecture','Learn REST methods and status codes','Sketch API endpoints']},
    {title:'SQL and indexing',focus:'DBMS / SQL',tasks:['Practice joins and subqueries','Learn index trade-offs','Practice 5 SQL questions']},
    {title:'Caching and scaling',focus:'System design',tasks:['Learn caching and load balancing','Compare vertical/horizontal scaling','Draw an architecture']},
    {title:'Replication and consistency',focus:'System design',tasks:['Learn replication and partitioning','Discuss consistency trade-offs','Review DBMS notes']},
    {title:'Design a task manager',focus:'System design',tasks:['Define requirements and entities','Design API + database schema','Draw components and data flow']},
    {title:'Core CS mock',focus:'Interview practice',tasks:['Answer OOP/DBMS/CN questions aloud','Review SQL','Note weak answers']},
  ],
  [
    {title:'React foundations',focus:'Full stack',tasks:['Review components, props and state','Build a small component','Practice one DSA problem']},
    {title:'Hooks and API calls',focus:'Full stack',tasks:['Review useState/useEffect','Build a form and API call','Handle loading and errors']},
    {title:'Express and REST',focus:'Full stack',tasks:['Build a basic CRUD route','Validate request payloads','Practice one DSA problem']},
    {title:'MongoDB CRUD',focus:'Full stack',tasks:['Review schema and CRUD operations','Connect backend to database','Review API errors']},
    {title:'Integration',focus:'Full stack',tasks:['Connect frontend and backend','Test empty/loading/error states','Document setup steps']},
    {title:'Project build',focus:'Project',tasks:['Build task tracker or notes app','Finish one complete user workflow','Write README notes']},
    {title:'Project + timed DSA',focus:'Project',tasks:['Test main project flow','Take a timed DSA session','Revise OOP, DBMS and CN']},
  ],
  [
    {title:'Arrays, strings and hashing',focus:'Final revision',tasks:['Solve 2 timed problems','Review mistake notebook','Explain complexities']},
    {title:'Search, lists and stacks',focus:'Final revision',tasks:['Solve 2 timed problems','Review boundary conditions','Re-solve one old problem']},
    {title:'Trees, heaps and graphs',focus:'Final revision',tasks:['Solve 1–2 mixed problems','Explain BFS/DFS','Review graph complexities']},
    {title:'Recursion, greedy and DP',focus:'Final revision',tasks:['Solve one medium + one revision problem','Explain DP state/transition','Review weak patterns']},
    {title:'Core CS rapid revision',focus:'Interview practice',tasks:['Revise OOP and DBMS','Revise SQL and CN','Practice oral answers']},
    {title:'System design + project',focus:'Interview practice',tasks:['Explain project architecture','Review APIs and database design','Discuss trade-offs']},
    {title:'Final mock + retrospective',focus:'Assessment',tasks:['Complete a mock interview','Review progress and weak areas','Plan the next 90 days']},
  ],
  [
    {title:'Final revision: arrays & hashing',focus:'Final revision',tasks:['Solve one timed array/hash problem','Review your mistake notebook','Explain complexity aloud']},
    {title:'Final revision: pointers & search',focus:'Final revision',tasks:['Solve one timed pointer/search problem','Review boundary conditions','Re-solve one old problem']},
    {title:'Final revision: trees & graphs',focus:'Final revision',tasks:['Solve one tree or graph problem','Explain BFS and DFS','Review complexity']},
    {title:'Final revision: DP & recursion',focus:'Final revision',tasks:['Solve one DP/recursion problem','Explain state and base case','Review weak patterns']},
    {title:'Core CS + project review',focus:'Interview practice',tasks:['Revise OOP, DBMS, SQL and CN','Explain your project architecture','Practice oral answers']},
    {title:'Final mock & next steps',focus:'Assessment',tasks:['Complete a mock interview','Review the last 90 days','Plan your next learning cycle']},
  ],
]
const planForDay = (day: number): DayPlan => {
  const week = Math.min(12, Math.floor((day - 1) / 7))
  const weekday = (day - 1) % 7
  return weeks[week][weekday]
}
const defaultTasks = (day: number): Task[] => {
  const plan = planForDay(day)
  const isWeekend = ((day - 1) % 7) >= 5
  const items = [
    {title:'Recall & warm-up', time:'8:00–8:15 PM', minutes:15,kind:'Recall'},
    {title:`Learn: ${plan.title}`, time:'8:15–9:00 PM', minutes:45,kind:'Learn'},
    {title:plan.tasks[0] || 'Solve a focused DSA problem',time:'9:10–9:40 PM',minutes:30,kind:'Practice'},
    {title:plan.tasks[1] || 'Solve a second DSA problem',time:'9:40–10:10 PM',minutes:30,kind:'Practice'},
    {title:plan.tasks[2] || (isWeekend ? 'Weekly review and weak-topic notes' : 'Revision / secondary subject'),time:'10:20–10:50 PM',minutes:30,kind:'Revision'},
    {title:'Log progress & plan tomorrow',time:'10:50–11:00 PM',minutes:10,kind:'Wrap-up'},
  ]
  return items.map((t,i)=>({ ...t,id:`d${day}-t${i}`,done:false }))
}
function makeInitialState(): State {
  const start = new Date()
  const tasks: Record<number,Task[]> = {}
  for(let day=1;day<=90;day++) tasks[day]=defaultTasks(day)
  return {startDate:start.toISOString().slice(0,10),selectedDay:1,tasks,completedDays:[],problems:[],courses:initialCourses,notes:{},dailyLog:{}}
}
function loadState(): State {
  try {
    const raw=localStorage.getItem(STORAGE_KEY)
    if(!raw) return makeInitialState()
    const saved=JSON.parse(raw) as Partial<State>
    const fresh=makeInitialState()
    return {...fresh,...saved,tasks:{...fresh.tasks,...saved.tasks},courses:saved.courses ?? initialCourses,problems:saved.problems ?? [],completedDays:saved.completedDays ?? []}
  } catch { return makeInitialState() }
}
const fmtDate = (start: string, day: number) => {
  const d = new Date(`${start}T12:00:00`)
  d.setDate(d.getDate()+day-1)
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})
}
const dayDateISO = (start:string,day:number) => {
  const d=new Date(`${start}T12:00:00`); d.setDate(d.getDate()+day-1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const percent = (n:number,total:number) => total ? Math.round(n/total*100) : 0

export default function App() {
  const [data,setData] = useState<State>(()=>loadState())
  const [page,setPage] = useState('Overview')
  const [sidebarOpen,setSidebarOpen] = useState(false)
  const [query,setQuery] = useState('')
  const [filter,setFilter] = useState('All')
  const [showProblemForm,setShowProblemForm] = useState(false)
  const [newProblem,setNewProblem] = useState({title:'',topic:'Arrays',difficulty:'Easy' as Problem['difficulty'],url:'',notes:''})
  const [showCourseForm,setShowCourseForm] = useState(false)
  const [newCourse,setNewCourse] = useState({title:'',provider:'Udemy',url:'',total:10,category:'Other'})
  const [toast,setToast] = useState('')
  const [calendarWeek,setCalendarWeek] = useState(0)

  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))},[data])
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2400);return()=>clearTimeout(t)},[toast])

  const allTasks = useMemo(()=>Object.values(data.tasks).flat(),[data.tasks])
  const tasksDone = allTasks.filter(t=>t.done).length
  const completedProblems = data.problems.filter(p=>p.status==='Solved').length
  const attemptedProblems = data.problems.filter(p=>p.status==='Attempted').length
  const completedCourseLessons = data.courses.reduce((sum,c)=>sum+c.completed,0)
  const totalCourseLessons = data.courses.reduce((sum,c)=>sum+c.total,0)
  const overall = percent(data.completedDays.length,90)
  const selectedTasks = data.tasks[data.selectedDay] ?? defaultTasks(data.selectedDay)
  const selectedPlan = planForDay(data.selectedDay)
  const todayISO = new Date().toISOString().slice(0,10)
  const elapsed = Math.max(1,Math.min(90,Math.floor((new Date(todayISO+'T12:00:00').getTime()-new Date(data.startDate+'T12:00:00').getTime())/86400000)+1))
  const currentDay = elapsed
  const currentWeek = Math.min(13,Math.ceil(currentDay/7))
  const dueProblems = data.problems.filter(p=>p.status!=='Solved' && p.date && p.date<=todayISO)
  const upcomingReviews = data.problems.filter(p=>p.status==='Solved' && p.date && [1,7,30].some(n=> {
    const d=new Date(p.date+'T12:00:00');d.setDate(d.getDate()+n)
    return d.toISOString().slice(0,10)<=todayISO
  }))
  const revisionItems = [...dueProblems.map(p=>({...p,reason:'Unfinished problem'})),...upcomingReviews.map(p=>({...p,reason:'Spaced repetition'}))]
  const weeklyData = Array.from({length:13},(_,i)=>{
    const days=Array.from({length:7},(_,j)=>i*7+j+1).filter(d=>d<=90)
    return {week:`W${i+1}`,minutes:days.reduce((sum,d)=>sum+(data.tasks[d]??[]).filter(t=>t.done).reduce((s,t)=>s+t.minutes,0),0),days:days.filter(d=>data.completedDays.includes(d)).length}
  })
  const topicCounts = useMemo(()=>{
    const map:Record<string,number>={}
    data.problems.forEach(p=>{if(p.status==='Solved')map[p.topic]=(map[p.topic]||0)+1})
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5)
  },[data.problems])
  const nav = [
    {name:'Overview',icon:LayoutDashboard},
    {name:'90-Day Calendar',icon:CalendarDays},
    {name:'DSA Problems',icon:Code2},
    {name:'Revision Queue',icon:Brain},
    {name:'Courses',icon:GraduationCap},
    {name:'Analytics',icon:Activity},
  ]
  const update = (fn:(prev:State)=>State) => setData(prev=>fn(prev))
  const selectPage = (name:string) => {setPage(name);setSidebarOpen(false)}
  const toggleTask = (day:number,id:string) => update(prev=>{
    const tasks={...prev.tasks,[day]:(prev.tasks[day]??[]).map(t=>t.id===id?{...t,done:!t.done}:t)}
    const finished=tasks[day].length>0 && tasks[day].every(t=>t.done)
    const completedDays=finished?[...new Set([...prev.completedDays,day])]:prev.completedDays.filter(d=>d!==day)
    return {...prev,tasks,completedDays,dailyLog:{...prev.dailyLog,[dayDateISO(prev.startDate,day)]:tasks[day].filter(t=>t.done).reduce((s,t)=>s+t.minutes,0)}}
  })
  const markDayComplete = (day:number) => update(prev=>{
    const tasks={...prev.tasks,[day]:(prev.tasks[day]??defaultTasks(day)).map(t=>({...t,done:true}))}
    return {...prev,tasks,completedDays:[...new Set([...prev.completedDays,day])],dailyLog:{...prev.dailyLog,[dayDateISO(prev.startDate,day)]:tasks[day].reduce((s,t)=>s+t.minutes,0)}}
  })
  const addProblem = () => {
    if(!newProblem.title.trim())return
    const p:Problem={...newProblem,id:crypto.randomUUID(),status:'Todo',date:todayISO}
    update(prev=>({...prev,problems:[p,...prev.problems]}))
    setNewProblem({title:'',topic:'Arrays',difficulty:'Easy',url:'',notes:''});setShowProblemForm(false);setToast('Problem added to your tracker')
  }
  const addCourse = () => {
    if(!newCourse.title.trim())return
    update(prev=>({...prev,courses:[...prev.courses,{...newCourse,id:crypto.randomUUID(),total:Math.max(1,newCourse.total),completed:0}]}))
    setNewCourse({title:'',provider:'Udemy',url:'',total:10,category:'Other'});setShowCourseForm(false);setToast('Course added')
  }
  const exportData = () => {
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='studysprint-backup.json';a.click();URL.revokeObjectURL(url);setToast('Backup exported')
  }
  const importData = (file?:File) => {
    if(!file)return
    const reader=new FileReader()
    reader.onload=()=>{try{const parsed=JSON.parse(String(reader.result)) as State;if(!parsed.tasks||!parsed.startDate)throw new Error('Invalid backup');setData(parsed);setToast('Backup imported')}catch{setToast('Could not import this backup file')}}
    reader.readAsText(file)
  }
  const resetProgress = () => {
    if(confirm('Reset all planner progress and return to a fresh 90-day plan? Export a backup first if needed.')){setData(makeInitialState());setPage('Overview');setToast('Planner reset')}
  }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><Command size={20}/></div><div><strong>StudySprint</strong><span>90-DAY INTERVIEW PLAN</span></div><button className="icon-btn mobile-close" onClick={()=>setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="profile-card"><div className="avatar">M</div><div className="profile-copy"><strong>My study space</strong><span>Personal workspace</span></div><span className="online-dot"/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">{nav.map(item=><button key={item.name} className={`nav-item ${page===item.name?'active':''}`} onClick={()=>selectPage(item.name)}><item.icon size={18}/><span>{item.name}</span>{item.name==='Revision Queue'&&revisionItems.length>0&&<span className="nav-count">{revisionItems.length}</span>}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-goal"><div className="goal-icon"><Target size={18}/></div><strong>Consistency beats intensity.</strong><p>Show up for your 3-hour study block. Small wins compound.</p><div className="mini-progress"><span style={{width:`${overall}%`}}/></div><div className="goal-foot"><span>90-day goal</span><span>{overall}%</span></div></div>
      <button className="nav-item settings-item" onClick={()=>selectPage('Settings')}><Settings2 size={18}/><span>Settings & backup</span></button>
      <div className="sidebar-footer"><span className="status-dot"/> Saved locally in this browser</div>
    </aside>
    {sidebarOpen&&<button className="mobile-scrim" aria-label="Close navigation" onClick={()=>setSidebarOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="icon-btn menu-btn" onClick={()=>setSidebarOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{page}</strong></div></div><div className="top-actions"><div className="date-chip"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div><button className="avatar small-avatar" title="Personal workspace">M</button></div></header>
      <div className="content">
        {page==='Overview'&&<Overview data={data} tasksDone={tasksDone} completedProblems={completedProblems} attemptedProblems={attemptedProblems} completedCourseLessons={completedCourseLessons} totalCourseLessons={totalCourseLessons} overall={overall} currentDay={currentDay} currentWeek={currentWeek} selectedTasks={selectedTasks} selectedPlan={selectedPlan} onToggle={toggleTask} onMarkComplete={markDayComplete} onPage={selectPage} onDay={d=>update(p=>({...p,selectedDay:d}))} revisionCount={revisionItems.length} />}
        {page==='90-Day Calendar'&&<CalendarPage data={data} currentDay={currentDay} calendarWeek={calendarWeek} setCalendarWeek={setCalendarWeek} onSelect={d=>{update(p=>({...p,selectedDay:d}));selectPage('Overview')}} />}
        {page==='DSA Problems'&&<ProblemsPage problems={data.problems} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onAdd={()=>setShowProblemForm(true)} onStatus={(id,status)=>update(p=>({...p,problems:p.problems.map(x=>x.id===id?{...x,status}:x)}))} onDelete={id=>update(p=>({...p,problems:p.problems.filter(x=>x.id!==id)}))} />}
        {page==='Revision Queue'&&<RevisionPage items={revisionItems} onStatus={(id,status)=>update(p=>({...p,problems:p.problems.map(x=>x.id===id?{...x,status}:x)}))} onPage={selectPage}/>}
        {page==='Courses'&&<CoursesPage courses={data.courses} onAdd={()=>setShowCourseForm(true)} onIncrement={(id,delta)=>update(p=>({...p,courses:p.courses.map(c=>c.id===id?{...c,completed:Math.max(0,Math.min(c.total,c.completed+delta))}:c)}))} onDelete={id=>update(p=>({...p,courses:p.courses.filter(c=>c.id!==id)}))}/>}
        {page==='Analytics'&&<AnalyticsPage data={data} weeklyData={weeklyData} topicCounts={topicCounts} tasksDone={tasksDone} overall={overall} completedProblems={completedProblems}/>}
        {page==='Settings'&&<SettingsPage data={data} onStartDate={date=>update(p=>({...p,startDate:date,selectedDay:1}))} onExport={exportData} onImport={importData} onReset={resetProgress}/>}
      </div>
    </main>
    {showProblemForm&&<Modal title="Add a DSA problem" onClose={()=>setShowProblemForm(false)}><div className="form-grid"><label className="full">Problem name<input autoFocus value={newProblem.title} onChange={e=>setNewProblem(p=>({...p,title:e.target.value}))} placeholder="e.g. Two Sum"/></label><label>Pattern<select value={newProblem.topic} onChange={e=>setNewProblem(p=>({...p,topic:e.target.value}))}>{['Arrays','Strings','Hashing','Two pointers','Sliding window','Binary search','Linked lists','Stacks / queues','Recursion','Backtracking','Trees','Graphs','Dynamic programming','Greedy','Bit manipulation','SQL','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Difficulty<select value={newProblem.difficulty} onChange={e=>setNewProblem(p=>({...p,difficulty:e.target.value as Problem['difficulty']}))}><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label className="full">Problem URL (optional)<input value={newProblem.url} onChange={e=>setNewProblem(p=>({...p,url:e.target.value}))} placeholder="https://leetcode.com/problems/..."/></label><label className="full">Notes (optional)<textarea value={newProblem.notes} onChange={e=>setNewProblem(p=>({...p,notes:e.target.value}))} placeholder="Pattern, mistake, complexity..." rows={3}/></label></div><div className="modal-actions"><button className="btn secondary" onClick={()=>setShowProblemForm(false)}>Cancel</button><button className="btn primary" onClick={addProblem}><Plus size={16}/> Add problem</button></div></Modal>}
    {showCourseForm&&<Modal title="Add a course" onClose={()=>setShowCourseForm(false)}><div className="form-grid"><label className="full">Course name<input autoFocus value={newCourse.title} onChange={e=>setNewCourse(p=>({...p,title:e.target.value}))} placeholder="Course title"/></label><label>Provider<input value={newCourse.provider} onChange={e=>setNewCourse(p=>({...p,provider:e.target.value}))}/></label><label>Category<select value={newCourse.category} onChange={e=>setNewCourse(p=>({...p,category:e.target.value}))}>{['Python','DSA','Full stack','OOP','DBMS','Computer networks','System design','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label className="full">Course URL<input value={newCourse.url} onChange={e=>setNewCourse(p=>({...p,url:e.target.value}))} placeholder="https://..."/></label><label className="full">Total lessons / sections<input type="number" min="1" value={newCourse.total} onChange={e=>setNewCourse(p=>({...p,total:Number(e.target.value)}))}/></label></div><div className="modal-actions"><button className="btn secondary" onClick={()=>setShowCourseForm(false)}>Cancel</button><button className="btn primary" onClick={addCourse}><Plus size={16}/> Add course</button></div></Modal>}
    {toast&&<div className="toast"><Check size={16}/>{toast}</div>}
  </div>
}

function PageHeader({eyebrow,title,desc,action}:{eyebrow:string,title:string,desc:string,action?:React.ReactNode}) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div>{action}</div>
}
function StatCard({label,value,foot,icon:Icon,tone,trend}:{label:string,value:string|number,foot:string,icon:typeof Target,tone:string,trend?:string}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-foot">{trend&&<span className="trend"><ArrowUpRight size={13}/>{trend}</span>}{foot}</div></div>
}
function SectionTitle({title,subtitle,action}:{title:string,subtitle?:string,action?:React.ReactNode}) {return <div className="section-title"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>}
function ProgressBar({value,tone='purple'}:{value:number,tone?:string}) {return <div className={`progress-track ${tone}`}><span style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>}
function Overview({data,tasksDone,completedProblems,attemptedProblems,completedCourseLessons,totalCourseLessons,overall,currentDay,currentWeek,selectedTasks,selectedPlan,onToggle,onMarkComplete,onPage,onDay,revisionCount}:{data:State,tasksDone:number,completedProblems:number,attemptedProblems:number,completedCourseLessons:number,totalCourseLessons:number,overall:number,currentDay:number,currentWeek:number,selectedTasks:Task[],selectedPlan:DayPlan,onToggle:(d:number,id:string)=>void,onMarkComplete:(d:number)=>void,onPage:(p:string)=>void,onDay:(d:number)=>void,revisionCount:number}) {
  const dayDone=selectedTasks.filter(t=>t.done).length
  const dayMinutes=selectedTasks.filter(t=>t.done).reduce((s,t)=>s+t.minutes,0)
  const focusTopics=['Arrays & strings','Hashing','Two pointers','Sliding window','Binary search','Linked lists','Stacks & queues','Recursion','Trees','Graphs','Dynamic programming']
  return <>
    <PageHeader eyebrow="THURSDAY, YOUR NEXT CHAPTER STARTS HERE" title="Good evening, Meghana 👋" desc="A little progress every day adds up. Let's make tonight count." action={<button className="btn secondary" onClick={()=>onPage('90-Day Calendar')}><CalendarDays size={16}/> View roadmap</button>}/>
    <div className="hero-card"><div className="hero-glow"/><div className="hero-copy"><div className="hero-pill"><span className="pulse-dot"/> YOUR 90-DAY SPRINT <span className="pill-sep">/</span> WEEK {currentWeek} OF 13</div><h2>Build the habit.<br/><span>Become interview-ready.</span></h2><p>DSA first. Core CS next. Confidence through practice.</p><div className="hero-meta"><span><CalendarDays size={15}/> Day {currentDay} of 90</span><span><Clock3 size={15}/> 8:00 PM – 11:00 PM</span></div></div><div className="hero-progress"><div className="ring" style={{'--progress':`${overall*3.6}deg`} as React.CSSProperties}><div className="ring-inner"><strong>{overall}%</strong><span>COMPLETED</span></div></div><span className="ring-caption">{data.completedDays.length} of 90 study days</span></div><div className="hero-gridline"/></div>
    <div className="stats-grid">
      <StatCard label="Problems solved" value={completedProblems} foot={`${attemptedProblems} attempted`} icon={Code2} tone="purple" trend={completedProblems?`${completedProblems} total`:undefined}/>
      <StatCard label="Study days done" value={`${data.completedDays.length}/90`} foot={`${overall}% of your sprint`} icon={CalendarDays} tone="blue"/>
      <StatCard label="Study time logged" value={`${Math.floor(tasksDone?Object.values(data.tasks).flat().filter(t=>t.done).reduce((s,t)=>s+t.minutes,0)/60:0)}h`} foot={`${tasksDone} sessions checked off`} icon={Clock3} tone="green"/>
      <StatCard label="Course lessons" value={`${completedCourseLessons}/${totalCourseLessons}`} foot="Across your courses" icon={GraduationCap} tone="orange"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel today-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR FOCUS FOR TODAY</div><h2>{selectedPlan.title}</h2><p>{fmtDate(data.startDate,data.selectedDay)} · Day {data.selectedDay} · {selectedPlan.focus}</p></div><span className="today-badge"><Flame size={14}/> {dayDone===selectedTasks.length?'Complete':`${dayDone}/${selectedTasks.length}`}</span></div><div className="day-selector"><button className="icon-btn" disabled={data.selectedDay<=1} onClick={()=>onDay(data.selectedDay-1)}><ChevronLeft size={16}/></button><span>DAY {data.selectedDay} / 90</span><button className="icon-btn" disabled={data.selectedDay>=90} onClick={()=>onDay(data.selectedDay+1)}><ChevronRight size={16}/></button></div><div className="task-list">{selectedTasks.map((t)=><div className={`task-row ${t.done?'task-done':''}`} key={t.id}><button className={`task-check ${t.done?'checked':''}`} onClick={()=>onToggle(data.selectedDay,t.id)} aria-label={t.done?'Mark incomplete':'Mark complete'}>{t.done&&<Check size={14}/>}</button><div className="task-main"><strong>{t.title}</strong><span>{t.time} <i/> {t.minutes} min</span></div><span className={`task-type type-${t.kind.toLowerCase()}`}>{t.kind}</span></div>)}</div><div className="today-bottom"><div><strong>{dayMinutes} <small>/ 160 min</small></strong><ProgressBar value={percent(dayMinutes,160)}/></div><button className="btn primary" onClick={()=>onMarkComplete(data.selectedDay)}><CheckCheck size={16}/> Complete day</button></div></section>
      <div className="right-stack"><section className="panel week-panel"><SectionTitle title="This week's progress" subtitle={`Week ${currentWeek} · ${Math.min(7,90-(currentWeek-1)*7)} day sprint`}/><div className="week-days">{Array.from({length:7},(_,i)=>{const d=(currentWeek-1)*7+i+1;const valid=d<=90;const done=data.completedDays.includes(d);return <button key={d} className={`week-day ${!valid?'muted':done?'done':d===currentDay?'current':''}`} onClick={()=>valid&&onDay(d)} disabled={!valid} title={`Day ${d}`}><span>{['M','T','W','T','F','S','S'][i]}</span><b>{valid?d:'—'}</b>{done?<Check size={12}/>:<i/>}</button>})}</div><div className="week-footer"><span><i className="legend-dot done-dot"/> Completed</span><span><i className="legend-dot current-dot"/> Current day</span><button className="text-btn" onClick={()=>onPage('90-Day Calendar')}>Full calendar <ChevronRight size={14}/></button></div></section>
        <section className="panel focus-panel"><SectionTitle title="Your learning focus" subtitle="DSA patterns to build this month"/><div className="focus-list">{focusTopics.slice(0,4).map((t,i)=><div className="focus-item" key={t}><span className={`focus-number n${i+1}`}>0{i+1}</span><span>{t}</span><span className="focus-status">{i===0?'In progress':i===1?'Upcoming':'Locked'}</span></div>)}</div><a className="resource-link" href={risingBrain} target="_blank" rel="noreferrer"><span className="resource-icon"><BookOpen size={16}/></span><span><strong>RisingBrain DSA sheet</strong><small>Pattern-based problem practice</small></span><ExternalLink size={15}/></a></section>
      </div>
    </div>
    <div className="bottom-grid"><section className="panel"><SectionTitle title="Your 90-day journey" subtitle="A balanced plan, one phase at a time"/><div className="phase-list"><div className="phase-row"><div className="phase-symbol phase-one"><Code2 size={17}/></div><div className="phase-copy"><strong>01 · DSA foundations</strong><span>Weeks 1–4 · Arrays, strings, search, recursion</span><ProgressBar value={percent(data.completedDays.filter(d=>d<=28).length,28)}/></div><span className="phase-percent">{percent(data.completedDays.filter(d=>d<=28).length,28)}%</span></div><div className="phase-row"><div className="phase-symbol phase-two"><Brain size={17}/></div><div className="phase-copy"><strong>02 · DSA + core CS</strong><span>Weeks 5–8 · Trees, graphs, DP, OOP, DBMS</span><ProgressBar value={percent(data.completedDays.filter(d=>d>28&&d<=56).length,28)}/></div><span className="phase-percent">{percent(data.completedDays.filter(d=>d>28&&d<=56).length,28)}%</span></div><div className="phase-row"><div className="phase-symbol phase-three"><Trophy size={17}/></div><div className="phase-copy"><strong>03 · Interview readiness</strong><span>Weeks 9–13 · CN, system design, mocks, project</span><ProgressBar value={percent(data.completedDays.filter(d=>d>56).length,34)}/></div><span className="phase-percent">{percent(data.completedDays.filter(d=>d>56).length,34)}%</span></div></div></section>
      <section className="panel workflow-panel"><SectionTitle title="The daily workflow" subtitle="Consistency over intensity"/><div className="workflow-step"><span className="workflow-icon purple"><Brain size={16}/></span><div><strong>Learn one concept</strong><small>45 minutes · Understand the pattern</small></div></div><div className="workflow-line"/><div className="workflow-step"><span className="workflow-icon blue"><Code2 size={16}/></span><div><strong>Solve two problems</strong><small>60 minutes · Attempt before hints</small></div></div><div className="workflow-line"/><div className="workflow-step"><span className="workflow-icon green"><ListChecks size={16}/></span><div><strong>Revise and log</strong><small>30 minutes · Capture mistakes</small></div></div><button className="btn secondary full-btn" onClick={()=>onPage('Revision Queue')}>Review due problems <span className="count-badge">{revisionCount}</span></button></section></div>
    <footer className="page-footer"><span>Made for the long game <span className="heart">♥</span></span><span>Progress saves automatically on this device</span></footer>
  </>
}
function CalendarPage({data,currentDay,calendarWeek,setCalendarWeek,onSelect}:{data:State,currentDay:number,calendarWeek:number,setCalendarWeek:(n:number)=>void,onSelect:(d:number)=>void}) {
  const start=calendarWeek*28+1
  const end=Math.min(90,start+27)
  return <><PageHeader eyebrow="YOUR ROADMAP" title="90-day calendar" desc="Select any day to view its focus and study checklist." action={<a className="btn secondary" href={whimsical} target="_blank" rel="noreferrer"><ExternalLink size={15}/> DSA pattern map</a>}/><div className="calendar-toolbar"><div><strong>Days {start}–{end}</strong><span> · {Math.floor((start-1)/7)+1}–{Math.ceil(end/7)} weeks</span></div><div className="calendar-controls"><button className="icon-btn" disabled={calendarWeek===0} onClick={()=>setCalendarWeek(Math.max(0,calendarWeek-1))}><ChevronLeft size={17}/></button><button className="icon-btn" disabled={calendarWeek===3} onClick={()=>setCalendarWeek(Math.min(3,calendarWeek+1))}><ChevronRight size={17}/></button></div></div><div className="calendar-grid">{Array.from({length:end-start+1},(_,i)=>start+i).map(day=>{const plan=planForDay(day);const done=data.completedDays.includes(day);const tasks=data.tasks[day]??[];const count=tasks.filter(t=>t.done).length;return <button key={day} className={`calendar-day ${done?'cal-done':day===currentDay?'cal-current':''}`} onClick={()=>onSelect(day)}><div className="cal-top"><span>DAY {String(day).padStart(2,'0')}</span>{done?<Check size={15}/>:day===currentDay?<span className="current-mini">NOW</span>:null}</div><strong>{plan.title}</strong><span className="cal-focus">{plan.focus}</span><div className="cal-bottom"><span>{fmtDate(data.startDate,day)}</span><span>{count}/{tasks.length} tasks</span></div><ProgressBar value={percent(count,tasks.length)} tone={done?'green':'purple'}/></button>})}</div><div className="calendar-legend"><span><i className="legend-dot done-dot"/> Completed</span><span><i className="legend-dot current-dot"/> Current day</span><span><i className="legend-dot"/> Upcoming</span></div><div className="resource-strip"><div className="resource-icon"><BookOpen size={18}/></div><div><strong>Follow the DSA pattern sheet</strong><p>Use your RisingBrain sheet to choose matching questions, then log each attempt in the tracker.</p></div><a href={risingBrain} target="_blank" rel="noreferrer" className="text-btn">Open sheet <ExternalLink size={14}/></a></div></>
}
function ProblemsPage({problems,query,setQuery,filter,setFilter,onAdd,onStatus,onDelete}:{problems:Problem[],query:string,setQuery:(s:string)=>void,filter:string,setFilter:(s:string)=>void,onAdd:()=>void,onStatus:(id:string,status:Problem['status'])=>void,onDelete:(id:string)=>void}) {
  const filtered=problems.filter(p=>(p.title.toLowerCase().includes(query.toLowerCase())||p.topic.toLowerCase().includes(query.toLowerCase()))&&(filter==='All'||p.status===filter))
  return <><PageHeader eyebrow="PATTERN-BASED PRACTICE" title="DSA problem tracker" desc="Track what you solve, what you struggle with, and what deserves another attempt." action={<button className="btn primary" onClick={onAdd}><Plus size={16}/> Add problem</button>}/><div className="stats-grid compact-stats"><StatCard label="Total tracked" value={problems.length} foot="Your problem log" icon={ListChecks} tone="purple"/><StatCard label="Solved" value={problems.filter(p=>p.status==='Solved').length} foot="Marked complete" icon={CheckCheck} tone="green"/><StatCard label="In progress" value={problems.filter(p=>p.status==='Attempted').length} foot="Needs another attempt" icon={Activity} tone="blue"/><StatCard label="To do" value={problems.filter(p=>p.status==='Todo').length} foot="Not solved yet" icon={Target} tone="orange"/></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search problems or patterns..."/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Todo</option><option>Attempted</option><option>Solved</option></select></div>{filtered.length===0?<EmptyState icon={Code2} title={problems.length?'No matching problems':'Your problem tracker is ready'} desc={problems.length?'Try a different search or status filter.':'Add your first LeetCode or HackerRank problem. Track its pattern, difficulty, and revision notes.'} action={!problems.length?<button className="btn primary" onClick={onAdd}><Plus size={15}/> Add your first problem</button>:undefined}/>:<div className="table-wrap"><table><thead><tr><th>PROBLEM</th><th>PATTERN</th><th>DIFFICULTY</th><th>STATUS</th><th>ADDED</th><th/></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="problem-name">{p.url?<a href={p.url} target="_blank" rel="noreferrer">{p.title} <ExternalLink size={12}/></a>:<strong>{p.title}</strong>}{p.notes&&<small>{p.notes}</small>}</div></td><td><span className="topic-pill">{p.topic}</span></td><td><span className={`difficulty diff-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span></td><td><select className={`status-select status-${p.status.toLowerCase()}`} value={p.status} onChange={e=>onStatus(p.id,e.target.value as Problem['status'])}><option>Todo</option><option>Attempted</option><option>Solved</option></select></td><td className="muted-cell">{p.date||'—'}</td><td><button className="icon-btn danger-hover" onClick={()=>onDelete(p.id)} title="Delete problem"><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>}</section><div className="resource-strip"><div className="resource-icon"><BookOpen size={18}/></div><div><strong>Choose problems by pattern, not at random</strong><p>Use the DSA sheet to find questions that match this week's concept.</p></div><a href={risingBrain} target="_blank" rel="noreferrer" className="text-btn">RisingBrain sheet <ExternalLink size={14}/></a></div></>
}
function RevisionPage({items,onStatus,onPage}:{items:(Problem&{reason:string})[],onStatus:(id:string,status:Problem['status'])=>void,onPage:(p:string)=>void}) {
  return <><PageHeader eyebrow="SPACED REPETITION" title="Revision queue" desc="Revisit difficult problems and reinforce patterns before they fade." action={<button className="btn secondary" onClick={()=>onPage('DSA Problems')}><Code2 size={16}/> All problems</button>}/><div className="revision-callout"><div className="revision-icon"><Brain size={20}/></div><div><strong>Review after 1 day, 7 days and 30 days</strong><p>Use spaced repetition to revisit solved problems. Mark a problem solved and keep its original date to make review dates meaningful.</p></div></div>{items.length===0?<EmptyState icon={CheckCheck} title="Your queue is clear" desc="Add problems to your tracker and mark them solved. Unfinished problems appear here; solved problems become review candidates after their spaced-repetition dates." action={<button className="btn primary" onClick={()=>onPage('DSA Problems')}>Open problem tracker</button>}/>:<div className="revision-list">{items.map(p=><div className="revision-item" key={`${p.id}-${p.reason}`}><div className="revision-item-icon">{p.reason==='Spaced repetition'?<Brain size={18}/>:<Code2 size={18}/>}</div><div className="revision-item-main"><div className="revision-tags"><span className="topic-pill">{p.topic}</span><span className={`difficulty diff-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><span className="review-reason">{p.reason}</span></div><strong>{p.title}</strong><p>{p.notes||'Try solving again without looking at the previous solution.'}</p>{p.url&&<a href={p.url} target="_blank" rel="noreferrer">Open problem <ExternalLink size={12}/></a>}</div><select className={`status-select status-${p.status.toLowerCase()}`} value={p.status} onChange={e=>onStatus(p.id,e.target.value as Problem['status'])}><option>Todo</option><option>Attempted</option><option>Solved</option></select></div>)}</div>}</>
}
function CoursesPage({courses,onAdd,onIncrement,onDelete}:{courses:Course[],onAdd:()=>void,onIncrement:(id:string,delta:number)=>void,onDelete:(id:string)=>void}) {
  return <><PageHeader eyebrow="LEARNING LIBRARY" title="Course tracker" desc="Keep courses in service of your roadmap—not the other way around." action={<button className="btn primary" onClick={onAdd}><Plus size={16}/> Add course</button>}/><div className="course-note"><BookOpen size={18}/><span><strong>Rule of thumb:</strong> watch a lesson, then implement or practice something from it. You don't need to finish every course section.</span></div><div className="courses-grid">{courses.map((c,i)=>{const pct=percent(c.completed,c.total);return <div className="course-card" key={c.id}><div className={`course-cover cover-${i%4}`}><div className="course-cover-top"><span>{c.category.toUpperCase()}</span><button className="icon-btn" onClick={()=>onDelete(c.id)} title="Remove course"><Trash2 size={15}/></button></div><div className="course-cover-icon">{c.category==='Python'?<Code2 size={28}/>:c.category==='Full stack'?<Command size={28}/>:<BookOpen size={28}/>}</div><div className="course-cover-title">{c.title}</div><span className="course-provider">{c.provider}</span></div><div className="course-body"><div className="course-progress-label"><strong>{pct}% complete</strong><span>{c.completed} / {c.total} lessons</span></div><ProgressBar value={pct} tone={pct===100?'green':'purple'}/><div className="course-actions"><button className="btn secondary small" onClick={()=>onIncrement(c.id,-1)} disabled={c.completed<=0}>− Lesson</button><button className="btn primary small" onClick={()=>onIncrement(c.id,1)} disabled={c.completed>=c.total}><Plus size={14}/> Lesson done</button></div>{c.url&&<a href={c.url} target="_blank" rel="noreferrer" className="course-link">Continue course <ExternalLink size={13}/></a>}</div></div>})}{courses.length===0&&<EmptyState icon={GraduationCap} title="Add your first course" desc="Track Udemy lessons, tutorials or learning modules." action={<button className="btn primary" onClick={onAdd}>Add course</button>}/>}</div></>
}
function AnalyticsPage({data,weeklyData,topicCounts,tasksDone,overall,completedProblems}:{data:State,weeklyData:{week:string,minutes:number,days:number}[],topicCounts:[string,number][],tasksDone:number,overall:number,completedProblems:number}) {
  const totalMinutes=Object.values(data.tasks).flat().filter(t=>t.done).reduce((s,t)=>s+t.minutes,0)
  const avg= data.completedDays.length?Math.round(totalMinutes/data.completedDays.length):0
  return <><PageHeader eyebrow="MEASURE YOUR MOMENTUM" title="Progress analytics" desc="Use your data to spot patterns, celebrate consistency and decide what to revise." action={<span className="date-chip"><Activity size={15}/> Live from your tracker</span>}/><div className="stats-grid"><StatCard label="Roadmap completion" value={`${overall}%`} foot={`${data.completedDays.length} days completed`} icon={Target} tone="purple"/><StatCard label="Problems solved" value={completedProblems} foot={`${data.problems.length} problems tracked`} icon={Code2} tone="blue"/><StatCard label="Study hours" value={`${(totalMinutes/60).toFixed(1)}h`} foot={`${tasksDone} sessions completed`} icon={Clock3} tone="green"/><StatCard label="Avg. minutes / done day" value={`${avg}m`} foot="Based on completed days" icon={Flame} tone="orange"/></div><div className="analytics-grid"><section className="panel chart-panel"><SectionTitle title="Weekly study time" subtitle="Minutes from completed checklist items"/><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyData} margin={{top:10,right:8,left:-20,bottom:0}}><defs><linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b7cf6" stopOpacity={0.28}/><stop offset="95%" stopColor="#8b7cf6" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#242c40" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="week" tick={{fill:'#8490aa',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#8490aa',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#111827',border:'1px solid #2b354b',borderRadius:10,color:'#e5e7eb'}} labelStyle={{color:'#aab4c9'}}/><Area type="monotone" dataKey="minutes" stroke="#9b8cff" strokeWidth={2.5} fill="url(#studyFill)" activeDot={{r:5,fill:'#b8adff'}}/></AreaChart></ResponsiveContainer></div><div className="chart-foot"><span><i className="chart-dot"/> Minutes studied</span><span>Goal: steady weekly consistency</span></div></section><section className="panel"><SectionTitle title="Topic strengths" subtitle="Solved problems by pattern"/>{topicCounts.length===0?<div className="chart-empty"><Code2 size={24}/><strong>No topic data yet</strong><p>Mark problems as solved to see your strongest patterns.</p></div>:<div className="topic-analytics">{topicCounts.map(([topic,count],i)=><div className="topic-analytic" key={topic}><div><span>{topic}</span><strong>{count}</strong></div><ProgressBar value={percent(count,Math.max(...topicCounts.map(x=>x[1])))} tone={['purple','blue','green','orange','purple'][i]}/></div>)}</div>}<div className="insight-box"><Brain size={17}/><div><strong>Use analytics to choose your next review</strong><p>Low solved counts may mean a topic needs more practice—not that you're bad at it.</p></div></div></section></div><section className="panel weekly-table"><SectionTitle title="12-week activity" subtitle="Completed study days and recorded minutes"/><div className="table-wrap"><table><thead><tr><th>WEEK</th><th>PHASE</th><th>STUDY DAYS</th><th>MINUTES LOGGED</th><th>PROGRESS</th></tr></thead><tbody>{weeklyData.map((w,i)=><tr key={w.week}><td><strong>{w.week}</strong></td><td>{i<4?'DSA foundations':i<8?'DSA + core CS':'Interview readiness'}</td><td>{w.days}/7</td><td>{w.minutes}</td><td><div className="table-progress"><ProgressBar value={percent(w.days,Math.min(7,90-i*7))}/><span>{percent(w.days,Math.min(7,90-i*7))}%</span></div></td></tr>)}</tbody></table></div></section></>
}
function SettingsPage({data,onStartDate,onExport,onImport,onReset}:{data:State,onStartDate:(s:string)=>void,onExport:()=>void,onImport:(f?:File)=>void,onReset:()=>void}) {
  return <><PageHeader eyebrow="YOUR WORKSPACE" title="Settings & backup" desc="Adjust your start date, keep your progress safe, and open your learning resources."/><div className="settings-grid"><section className="panel settings-card"><div className="settings-heading"><CalendarDays size={19}/><div><h2>90-day plan</h2><p>Choose the date you want Day 1 to represent.</p></div></div><label className="settings-label">Plan start date<input type="date" value={data.startDate} onChange={e=>onStartDate(e.target.value)}/></label><div className="setting-info"><CircleHelp size={16}/><span>Changing the start date changes the dates shown in your calendar. Your saved task completion remains intact.</span></div><div className="settings-divider"/><div className="settings-heading"><BookOpen size={19}/><div><h2>Learning resources</h2><p>Quick access to your original study resources.</p></div></div><a className="settings-link" href={risingBrain} target="_blank" rel="noreferrer"><span><strong>RisingBrain DSA sheet</strong><small>Pattern-based practice</small></span><ExternalLink size={15}/></a><a className="settings-link" href={whimsical} target="_blank" rel="noreferrer"><span><strong>DSA patterns map</strong><small>Whimsical reference</small></span><ExternalLink size={15}/></a><a className="settings-link" href="https://leetcode.com/problemset/" target="_blank" rel="noreferrer"><span><strong>LeetCode problem set</strong><small>Daily coding practice</small></span><ExternalLink size={15}/></a></section><section className="panel settings-card"><div className="settings-heading"><Download size={19}/><div><h2>Backup & restore</h2><p>Progress is saved in this browser only. Export a backup regularly.</p></div></div><button className="backup-row" onClick={onExport}><span className="backup-icon"><Download size={17}/></span><span><strong>Export planner data</strong><small>Download a JSON backup of tasks, problems and courses.</small></span><ChevronRight size={17}/></button><label className="backup-row upload-row"><span className="backup-icon"><ArrowDownRight size={17}/></span><span><strong>Import planner data</strong><small>Restore a previously exported JSON backup.</small></span><input type="file" accept="application/json,.json" onChange={e=>{onImport(e.target.files?.[0]);e.currentTarget.value=''}}/></label><div className="setting-info"><CircleHelp size={16}/><span>Local storage does not sync across browsers or devices. Importing a backup replaces current planner data.</span></div><div className="settings-divider"/><div className="danger-zone"><div><strong>Reset all progress</strong><p>Deletes the saved planner data in this browser and starts fresh.</p></div><button className="btn danger" onClick={onReset}><Trash2 size={15}/> Reset</button></div></section></div><div className="privacy-note"><Check size={16}/><span><strong>Privacy by design:</strong> your planner data stays in local browser storage. This app does not send it to a server.</span></div></>
}
function Modal({title,children,onClose}:{title:string,children:React.ReactNode,onClose:()=>void}) {
  useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[onClose])
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close modal"><X size={18}/></button></div>{children}</div></div>
}
function EmptyState({icon:Icon,title,desc,action}:{icon:typeof Target,title:string,desc:string,action?:React.ReactNode}) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={25}/></div><h3>{title}</h3><p>{desc}</p>{action}</div>
}
