import re

def sync_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update hero tabs in index.html
    old_tabs = """              <button type="button" class="hero-tab px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 font-medium transition-all flex-shrink-0 whitespace-nowrap" data-project="task">
                Task Planner
              </button>"""
    
    new_tabs = """              <button type="button" class="hero-tab px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 font-medium transition-all flex-shrink-0 whitespace-nowrap" data-project="task">
                Task Planner
              </button>
              <button type="button" class="hero-tab px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 font-medium transition-all flex-shrink-0 whitespace-nowrap" data-project="stjoseph">
                St. Joseph College
              </button>"""

    if "data-project=\"stjoseph\"" not in content and old_tabs in content:
        content = content.replace(old_tabs, new_tabs)
        print("Added St. Joseph tab to hero switcher in index.html")

    # 2. Update projects dictionary in hero switcher script
    old_dict = """        task: {
          title: "Task Planner & Momentum Engine",
          desc: "Offline-first productivity mobile application featuring categorized task queues, instant search, and local SQLite B-Tree storage.",
          img: "images/projects/task-planner/daily-momentum.jpg",
          badge: "Production v1.0",
          cat: "Mobile App • Flutter",
          sub: "0% Battery Drain",
          tags: ["Flutter", "Riverpod", "SQLite B-Tree"],
          link: "project-task-planner.html"
        }
      };"""

    new_dict = """        task: {
          title: "Task Planner & Momentum Engine",
          desc: "Offline-first productivity mobile application featuring categorized task queues, instant search, and local SQLite B-Tree storage.",
          img: "images/projects/task-planner/daily-momentum.jpg",
          badge: "Production v1.0",
          cat: "Mobile App • Flutter",
          sub: "0% Battery Drain",
          tags: ["Flutter", "Riverpod", "SQLite B-Tree"],
          link: "project-task-planner.html"
        },
        stjoseph: {
          title: "St. Joseph College of Arts & Science",
          desc: "30-day Instagram growth & admissions campaign in Tenkasi driving 77.8% non-follower discovery and 2,649 profile visits.",
          img: "images/projects/st-joseph/st-joseph-logo.jpg",
          badge: "100K+ Views",
          cat: "Digital Marketing • Higher Ed",
          sub: "77.8% Non-Followers",
          tags: ["Instagram Reels", "Admissions Funnel", "Education Growth"],
          link: "project-st-joseph.html"
        }
      };"""

    if "stjoseph: {" not in content and old_dict in content:
        content = content.replace(old_dict, new_dict)
        print("Added St. Joseph to hero switcher JS dictionary in index.html")

    # 3. Update Flagship Section header & grid
    old_grid_heading = """    <!-- Flagship Production Projects Showcase (4 Real Products) -->
    <section class="px-6 md:px-12 py-20 border-t border-white/10 bg-[#080A0F]">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p class="text-xs font-mono font-bold uppercase tracking-widest text-brand-blue mb-2">Featured Work</p>
            <h2 class="font-display text-3xl md:text-4xl font-bold text-white">Production Solutions We've Engineered</h2>
            <p class="text-neutral-400 text-sm mt-3">
              Inspect 4 real applications built by ANVION across web, mobile, vector PDF, and native desktop systems.
            </p>
          </div>"""

    new_grid_heading = """    <!-- Flagship Production Projects Showcase (5 Real Products & Campaigns) -->
    <section class="px-6 md:px-12 py-20 border-t border-white/10 bg-[#080A0F]">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p class="text-xs font-mono font-bold uppercase tracking-widest text-brand-blue mb-2">Featured Work</p>
            <h2 class="font-display text-3xl md:text-4xl font-bold text-white">Production Solutions &amp; Client Campaigns</h2>
            <p class="text-neutral-400 text-sm mt-3">
              Inspect 5 verified client systems and applications built by ANVION across digital marketing, web, mobile, vector PDF, and native desktop.
            </p>
          </div>"""

    if old_grid_heading in content:
        content = content.replace(old_grid_heading, new_grid_heading)
        print("Updated flagship section heading in index.html")

    old_grid_class = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">'
    new_grid_class = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">'
    if old_grid_class in content:
        content = content.replace(old_grid_class, new_grid_class)
        print("Updated flagship grid columns in index.html to 5 columns")

    # Add Card 5 for St. Joseph College right after Card 4 (Task Planner)
    old_task_planner_card_end = """              <div class="pt-4 mt-5 border-t border-white/10 flex items-center justify-between">
                <a href="project-task-planner.html" class="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-white transition-colors">
                  <span>Case Study</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
                <span class="text-[11px] text-teal-400 font-mono font-semibold">Zero Drain</span>
              </div>
            </div>
          </article>"""

    new_cards_with_st_joseph = """              <div class="pt-4 mt-5 border-t border-white/10 flex items-center justify-between">
                <a href="project-task-planner.html" class="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-white transition-colors">
                  <span>Case Study</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
                <span class="text-[11px] text-teal-400 font-mono font-semibold">Zero Drain</span>
              </div>
            </div>
          </article>

          <!-- Project 5: St. Joseph College -->
          <article class="tech-border rounded-xl overflow-hidden bg-surface group flex flex-col justify-between hover:border-brand-blue/50 transition-all">
            <div class="h-52 bg-gradient-to-b from-blue-950/30 via-surface to-black relative flex items-center justify-center p-4 overflow-hidden">
              <div class="relative w-28 h-28 rounded-2xl border border-brand-blue/40 bg-neutral-900/90 p-2 shadow-xl group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                <img src="images/projects/st-joseph/st-joseph-logo.jpg" alt="St. Joseph College Crest" class="w-full h-full object-contain filter drop-shadow-md" />
              </div>
              <span class="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-500/40">
                100K+ Views
              </span>
            </div>
            <div class="p-5 flex flex-col justify-between flex-grow">
              <div>
                <p class="text-[10px] font-mono uppercase tracking-widest text-brand-blue">Higher Education</p>
                <h3 class="font-display font-bold text-base text-white mt-1 group-hover:text-brand-blue transition-colors">St. Joseph College</h3>
                <p class="text-neutral-400 text-xs mt-2 leading-relaxed">
                  30-day social media and admissions campaign in Tenkasi achieving 77.8% non-follower reach and 2,649 profile visits.
                </p>
                <div class="flex flex-wrap gap-1.5 mt-4 text-[10px] font-mono">
                  <span class="px-2 py-0.5 rounded bg-blue-500/10 text-brand-blue border border-brand-blue/20">Reels</span>
                  <span class="px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">Admissions</span>
                  <span class="px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">Growth</span>
                </div>
              </div>
              <div class="pt-4 mt-5 border-t border-white/10 flex items-center justify-between">
                <a href="project-st-joseph.html" class="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-white transition-colors">
                  <span>Case Study</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
                <span class="text-[11px] text-emerald-400 font-mono font-semibold">77.8% New</span>
              </div>
            </div>
          </article>"""

    if "Project 5: St. Joseph College" not in content and old_task_planner_card_end in content:
        content = content.replace(old_task_planner_card_end, new_cards_with_st_joseph)
        print("Added St. Joseph College card to flagship section in index.html")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("index.html synced successfully!")

if __name__ == '__main__':
    sync_index()

