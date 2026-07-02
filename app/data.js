export const ETYPE = {
  grammar:    { c: "#D9534F", en: "Grammar",    uz: "Grammatika" },
  vocabulary: { c: "#E2402F", en: "Vocabulary", uz: "Lug'at" },
  spelling:   { c: "#7C5CBF", en: "Spelling",   uz: "Imlo" },
  cohesion:   { c: "#2F77C8", en: "Cohesion",   uz: "Bog'liqlik" },
};

const COL = { a: "#2A211E", b: "#FF5A4D", c: "#E8A33D", d: "#2E9E6B" };

export const TASKS = {
  t2: {
    label: { en: "Task 2 · Essay", uz: "Task 2 · Essay" },
    minWords: 250, minutes: 40,
    first: { en: "Task Response", uz: "Vazifaga javob (TR)" },
    questions: [
      { type: "Opinion", text: "Some people believe university education should be free for everyone, while others think students should pay their own tuition fees. To what extent do you agree or disagree?" },
      { type: "Discussion", text: "Some people think children should start learning a foreign language at primary school, while others believe it is better to begin at secondary school. Discuss both views and give your own opinion." },
      { type: "Problem / Solution", text: "In many large cities, traffic congestion is becoming a serious problem. What are the main causes of this, and what measures could be taken to solve it?" },
      { type: "Advantage / Disadvantage", text: "More and more people are choosing to work from home rather than in a traditional office. Do the advantages of this trend outweigh the disadvantages?" },
      { type: "Two-part", text: "Many people today spend a large amount of their free time on social media. Why do you think this is the case? Is it a positive or a negative development?" },
      { type: "Opinion", text: "Some people argue that governments should invest more money in public transport than in building new roads. To what extent do you agree or disagree?" },
      { type: "Problem / Solution", text: "In some countries the average weight of people is increasing while their levels of health and fitness are decreasing. What are the causes of this, and what measures could be taken to solve it?" },
      { type: "Discussion", text: "Some people believe it is best to accept a difficult situation, such as an unsatisfying job, while others argue it is better to try to improve it. Discuss both views and give your own opinion." },
      { type: "Discussion", text: "Many people believe that international tourism harms their country, while others see it as beneficial. Discuss both views and give your own opinion." },
      { type: "Discussion", text: "Some think that governments should ban dangerous sports, while others believe people should be free to choose. Discuss both views and give your own opinion." },
      { type: "Opinion", text: "In many countries the proportion of older people is steadily increasing. Does this trend have more positive or negative effects on society?" },
      { type: "Discussion", text: "Some people think university students should study whatever they like, while others believe they should only study subjects useful for the future, such as science and technology. Discuss both views and give your opinion." },
      { type: "Opinion", text: "Advertising discourages people from being individuals by making everyone want to look and behave the same. To what extent do you agree or disagree?" },
      { type: "Discussion", text: "Some people say the main aim of education is to prepare children to be useful members of society, while others believe it should help them fulfil their own potential. Discuss both views and give your opinion." },
      { type: "Advantage / Disadvantage", text: "Many museums and historical sites charge an entrance fee, while others are free. Do the advantages of charging for entry outweigh the disadvantages?" },
      { type: "Advantage / Disadvantage", text: "In the future, many cars, buses and trucks may be driverless. Do the benefits of this development outweigh the drawbacks?" },
      { type: "Discussion", text: "Some believe children should be taught to compete, while others think learning to cooperate is more valuable. Discuss both views and give your own opinion." },
      { type: "Problem / Solution", text: "Climate change is now widely seen as one of the most serious threats facing humanity. What are the main causes, and what can individuals do to help?" },
      { type: "Discussion", text: "Some people prefer to spend their money as soon as they earn it, while others believe saving for the future is wiser. Discuss both views and give your own opinion." },
      { type: "Two-part", text: "Many people work long hours and have little time for leisure. Why does this happen, and what effects does it have on individuals and society?" },
    ],
  },
  t1a: {
    label: { en: "Task 1 · Academic", uz: "Task 1 · Academic" },
    minWords: 150, minutes: 20,
    first: { en: "Task Achievement", uz: "Vazifa bajarilishi (TA)" },
    questions: [
      {
        type: "Bar chart", text: "The bar chart below shows the percentage of households in five income brackets in three countries in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: { kind: "bar", title: "Percentage of households by income bracket, 2020", yLabel: "% of households", yMax: 35, ySteps: 7,
          groups: ["Under $20k", "$20–40k", "$40–60k", "$60–80k", "Over $80k"],
          series: [{ name: "Country A", color: COL.a, data: [8, 15, 22, 28, 27] }, { name: "Country B", color: COL.b, data: [18, 25, 24, 19, 14] }, { name: "Country C", color: COL.c, data: [32, 28, 20, 13, 7] }],
          summary: "Grouped bar chart, % of households by income bracket in 2020. Brackets: Under $20k/$20-40k/$40-60k/$60-80k/Over $80k. Country A: 8,15,22,28,27. Country B: 18,25,24,19,14. Country C: 32,28,20,13,7." } },
      {
        type: "Line graph", text: "The line graph shows the average monthly rainfall in two cities over a one-year period. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: { kind: "line", title: "Average monthly rainfall in two cities (mm)", yLabel: "Rainfall (mm)", yMax: 160, ySteps: 8,
          x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          series: [{ name: "City X", color: COL.a, data: [120, 110, 90, 70, 50, 30, 20, 25, 45, 80, 100, 130] }, { name: "City Y", color: COL.b, data: [40, 45, 60, 80, 110, 140, 150, 145, 120, 90, 60, 45] }],
          summary: "Line graph, average monthly rainfall (mm) Jan-Dec. City X: 120,110,90,70,50,30,20,25,45,80,100,130. City Y: 40,45,60,80,110,140,150,145,120,90,60,45." } },
      {
        type: "Process diagram", text: "The diagram illustrates the process by which bottled water is produced and packaged. Summarise the information by selecting and reporting the main features.",
        chart: { kind: "process", title: "How bottled water is produced and packaged",
          steps: ["Water extracted from a natural source", "Filtered to remove particles", "Purified by UV treatment", "Plastic bottles formed and rinsed", "Water bottled and capped", "Labelled and packed for delivery"],
          summary: "Process diagram, bottled water production, 6 stages: 1 Water extracted from a natural source, 2 Filtered, 3 Purified by UV, 4 Bottles formed and rinsed, 5 Water bottled and capped, 6 Labelled and packed." } },
      {
        type: "Table", text: "The table compares the number of international tourists, in millions, visiting four European capital cities in 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: { kind: "table", title: "International tourists by city (millions)", columns: ["City", "2010", "2020"],
          rows: [["London", "14.6", "19.1"], ["Paris", "15.6", "19.0"], ["Rome", "9.4", "10.3"], ["Madrid", "7.1", "9.5"]],
          summary: "Table, international tourists (millions) 2010 vs 2020. London 14.6->19.1; Paris 15.6->19.0; Rome 9.4->10.3; Madrid 7.1->9.5." } },
      {
        type: "Pie charts", text: "The two pie charts show the proportion of energy produced from different sources in one country in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: { kind: "pies", title: "Energy production by source (%)",
          pies: [{ label: "2000", slices: [{ name: "Coal", v: 45, color: COL.a }, { name: "Gas", v: 25, color: COL.b }, { name: "Nuclear", v: 18, color: COL.c }, { name: "Renewables", v: 12, color: COL.d }] },
                 { label: "2020", slices: [{ name: "Coal", v: 22, color: COL.a }, { name: "Gas", v: 30, color: COL.b }, { name: "Nuclear", v: 16, color: COL.c }, { name: "Renewables", v: 32, color: COL.d }] }],
          summary: "Two pie charts, energy production by source %. 2000: Coal 45, Gas 25, Nuclear 18, Renewables 12. 2020: Coal 22, Gas 30, Nuclear 16, Renewables 32." } },
      {
        type: "Bar chart", text: "The bar chart shows the percentage of workers employed in three sectors — agriculture, industry and services — in four countries in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: { kind: "bar", title: "Employment by sector across four countries, 2020", yLabel: "% of workers", yMax: 70, ySteps: 7,
          groups: ["Country W", "Country X", "Country Y", "Country Z"],
          series: [{ name: "Agriculture", color: COL.d, data: [40, 25, 10, 5] }, { name: "Industry", color: COL.a, data: [30, 35, 30, 25] }, { name: "Services", color: COL.b, data: [30, 40, 60, 70] }],
          summary: "Grouped bar chart, % of workers by sector in 2020. Agriculture: W40,X25,Y10,Z5. Industry: W30,X35,Y30,Z25. Services: W30,X40,Y60,Z70." } },
      {
        type: "Line graph", text: "The line graph shows the population of two countries, in millions, from 1980 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: { kind: "line", title: "Population of two countries, 1980–2020 (millions)", yLabel: "Population (m)", yMax: 100, ySteps: 5,
          x: ["1980", "1990", "2000", "2010", "2020"],
          series: [{ name: "Country A", color: COL.a, data: [50, 60, 72, 85, 95] }, { name: "Country B", color: COL.b, data: [30, 38, 49, 63, 80] }],
          summary: "Line graph, population (millions) 1980-2020. Country A: 50,60,72,85,95. Country B: 30,38,49,63,80." } },
      {
        type: "Table", text: "The table shows car ownership per 1,000 people in four cities in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: { kind: "table", title: "Car ownership per 1,000 people", columns: ["City", "2000", "2020"],
          rows: [["London", "380", "410"], ["Tokyo", "290", "320"], ["New York", "420", "450"], ["Mumbai", "60", "130"]],
          summary: "Table, cars per 1,000 people 2000 vs 2020. London 380->410; Tokyo 290->320; New York 420->450; Mumbai 60->130." } },
    ],
  },
  t1g: {
    label: { en: "Task 1 · General (Letter)", uz: "Task 1 · General (Xat)" },
    minWords: 150, minutes: 20,
    first: { en: "Task Achievement", uz: "Vazifa bajarilishi (TA)" },
    questions: [
      { type: "Complaint", text: "You recently stayed at a hotel and were unhappy with the service. Write a letter to the hotel manager. In your letter: explain why you were staying there, describe what went wrong, and say what you would like the manager to do." },
      { type: "Friendly", text: "A friend is planning to visit your country for the first time. Write a letter to your friend. In your letter: say which time of year is best to visit, suggest some places to see, and explain what they should bring." },
      { type: "Formal request", text: "You missed an important class at your college. Write a letter to your teacher. In your letter: explain why you missed the class, say what you have done to catch up, and ask for any additional help." },
      { type: "Workplace", text: "You would like to take two weeks off work for a personal reason. Write a letter to your manager. In your letter: explain why you need the time off, suggest how your work could be covered, and say when you would like to take the leave." },
      { type: "Personal", text: "A friend has asked to borrow something valuable that belongs to you. Write a letter to your friend. In your letter: explain why the item is important to you, say whether you will lend it, and set any conditions." },
      { type: "Job application", text: "You saw an advertisement for a part-time job at a local cafe. Write a letter to the manager. In your letter: explain why you are interested, describe your relevant experience, and say when you are available." },
      { type: "Complaint", text: "Your neighbour has been making a lot of noise recently. Write a letter to your neighbour. In your letter: describe the problem, explain how it affects you, and suggest a solution." },
      { type: "Thank you", text: "You recently stayed with a host family while studying abroad. Write a letter to them. In your letter: thank them for their hospitality, mention something you particularly enjoyed, and invite them to visit you." },
      { type: "Enquiry", text: "You want to enrol in an evening course at a local college. Write a letter to the college. In your letter: ask about the courses available, the timetable, and the fees." },
      { type: "Formal request", text: "You left a bag on a train. Write a letter to the railway company. In your letter: describe the bag and its contents, say where and when you lost it, and ask what they can do to help." },
    ],
  },
};

export const TASK_ORDER = ["t2", "t1a", "t1g"];

export const VOCAB = {
  Environment: [
    { word: "carbon footprint", meaning: "total greenhouse gases an activity produces", ex: "Cities must cut their carbon footprint through cleaner transport." },
    { word: "sustainable development", meaning: "growth that doesn't harm the future", ex: "Governments increasingly prioritise sustainable development." },
    { word: "deplete natural resources", meaning: "to use up the earth's resources", ex: "Overconsumption continues to deplete natural resources." },
    { word: "mitigate climate change", meaning: "to reduce its effects", ex: "Global cooperation is essential to mitigate climate change." },
  ],
  Education: [
    { word: "rote learning", meaning: "memorising without understanding", ex: "An over-reliance on rote learning stifles creativity." },
    { word: "critical thinking", meaning: "analysing ideas carefully", ex: "Universities should foster critical thinking, not memorisation." },
    { word: "lifelong learning", meaning: "learning throughout one's life", ex: "The modern economy rewards lifelong learning." },
    { word: "a well-rounded education", meaning: "broad and balanced learning", ex: "A well-rounded education develops more than exam skills." },
  ],
  Technology: [
    { word: "digital literacy", meaning: "the ability to use technology", ex: "Schools must build students' digital literacy." },
    { word: "automation", meaning: "machines doing human tasks", ex: "Automation threatens many low-skilled jobs." },
    { word: "data privacy", meaning: "protection of personal information", ex: "Users are increasingly concerned about data privacy." },
    { word: "bridge the digital divide", meaning: "reduce the tech-access gap", ex: "Affordable internet helps bridge the digital divide." },
  ],
  Health: [
    { word: "a sedentary lifestyle", meaning: "too little physical activity", ex: "A sedentary lifestyle raises the risk of heart disease." },
    { word: "preventive healthcare", meaning: "stopping illness before it starts", ex: "Investing in preventive healthcare lowers long-term costs." },
    { word: "mental wellbeing", meaning: "psychological health", ex: "Workplaces now pay more attention to mental wellbeing." },
    { word: "put a strain on", meaning: "to place a heavy burden on", ex: "An ageing population puts a strain on health services." },
  ],
  Work: [
    { word: "work-life balance", meaning: "balance of work and personal life", ex: "Remote work can improve work-life balance." },
    { word: "career progression", meaning: "advancing in a career", ex: "Clear career progression motivates employees." },
    { word: "burnout", meaning: "exhaustion from overwork", ex: "Excessively long hours often lead to burnout." },
    { word: "transferable skills", meaning: "skills usable across jobs", ex: "Communication is a valuable transferable skill." },
  ],
};