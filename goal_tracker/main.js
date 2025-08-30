const form = document.getElementById('goal-form');
const nameInput = document.getElementById('goal-name');
const deadlineInput = document.getElementById('goal-deadline');
const goalsList = document.getElementById('goals-list');
const motivation = document.getElementById('motivation');

const MOTIVATIONAL_QUOTES = [
  "Deadlines bring dreams to life.",
  "Today’s effort, tomorrow’s achievement.",
  "Every day counts—one goal at a time.",
  "Visualize the win. Refuse to quit."
];

function getGoals() {
  return JSON.parse(localStorage.getItem('goals') || '[]');
}

function saveGoals(goals) {
  localStorage.setItem('goals', JSON.stringify(goals));
}

function renderGoals() {
  const goals = getGoals();
  goalsList.innerHTML = '';
  const today = new Date().setHours(0,0,0,0);
  goals.forEach((goal, idx) => {
    const deadline = new Date(goal.deadline).setHours(0,0,0,0);
    let blockClass = 'goal-block';
    if (goal.complete) blockClass += ' goal-complete';
    else if (deadline < today) blockClass += ' goal-overdue';

    const block = document.createElement('div');
    block.className = blockClass;
    block.innerHTML = `
      <strong>${goal.name}</strong>
      <div>Deadline: ${goal.deadline}</div>
      <div>Status: <span>${goal.complete ? 'Completed' : (deadline < today ? 'Overdue' : 'In Progress')}</span></div>
      <button onclick="toggleComplete(${idx})">${goal.complete ? 'Mark Incomplete' : 'Mark Complete'}</button>
      <button onclick="deleteGoal(${idx})" style="float:right;">Delete</button>
    `;
    goalsList.appendChild(block);
    if (goal.complete) confettiCelebrate();
  });
  if (goals.length === 0) {
    goalsList.innerHTML = '<em>No goals yet. Add one above!</em>';
  }
  motivation.textContent = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

form.onsubmit = function (e) {
  e.preventDefault();
  const goals = getGoals();
  goals.push({
    name: nameInput.value,
    deadline: deadlineInput.value,
    complete: false
  });
  saveGoals(goals);
  renderGoals();
  form.reset();
};

window.toggleComplete = function(idx) {
  const goals = getGoals();
  goals[idx].complete = !goals[idx].complete;
  saveGoals(goals);
  renderGoals();
};

window.deleteGoal = function(idx) {
  const goals = getGoals();
  goals.splice(idx, 1);
  saveGoals(goals);
  renderGoals();
};

function confettiCelebrate() {
  alert("Congratulations! You completed your goal!");
}

renderGoals();
