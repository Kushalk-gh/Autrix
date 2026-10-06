# Orchestry: Start the project from the beginning

This is the easiest beginner-friendly way to run the project on your computer.

Important:
- Use Docker Desktop for Docker engine.
- Use the Ubuntu terminal inside VS Code for commands.
- Do not run the project inside the Docker container shell. Use the host Ubuntu terminal in VS Code.

---

## 1) Start Docker Desktop

1. Open the Docker Desktop app on your computer.
2. Wait until Docker says it is running.
3. You will usually see a green or running status in the Docker Desktop app.
4. This is the "engine" that runs all the containers for the project.

Think of Docker Desktop as the power switch for the containers.

> The Play/Pause button in Docker Desktop is used to start or stop the Docker engine. It is not the same as starting the project itself.

---

## 2) Open VS Code

1. Open VS Code.
2. Open the project folder:
   - D:\MAJOR PROJECT\Orchestry
3. In VS Code, open the terminal:
   - Click Terminal > New Terminal
4. In the terminal dropdown, select Ubuntu or WSL.

If you do not see Ubuntu:
- install WSL and Ubuntu once from Windows Terminal or command prompt
- then reopen VS Code and choose Ubuntu terminal

This is the terminal where you will type the commands.

---

## 3) Go to the project folder in Ubuntu terminal

In the VS Code Ubuntu Terminal, type:

```bash
cd /mnt/d/MAJOR\ PROJECT/Orchestry
ls
```

You should see files like:
- docker-compose.yml
- start.sh
- controller/
- configs/
- docs/

---

## 4) Check if Docker is working from the Ubuntu terminal

Run:

```bash
docker --version
docker compose version
```

If these commands work, Docker is ready.

---

## 5) Start the project

From the Ubuntu terminal, run:

```bash
docker compose up --build -d
```

What this does:
- builds the container images if needed
- creates the Postgres database containers
- creates the controller cluster containers
- starts the NGINX load balancer
- runs everything in the background

This is the main command to run the project.

---

## 6) Wait a little and check if it started

Give it a few minutes. The database and controller services may take some time to become healthy.

Check the running containers:

```bash
docker compose ps
```

You should see services like:
- postgres-primary
- postgres-replica
- nginx
- controller-1
- controller-2
- controller-3
- controller-lb

---

## 7) Check the cluster health

Open the Ubuntu terminal and run:

```bash
curl http://localhost:8000/cluster/health
```

Also check the current leader:

```bash
curl http://localhost:8000/cluster/leader
```

If the cluster is ready, you will get a health response and leader information.

---

## 8) Open the project in browser

After the containers are up, open the browser and paste:

- http://localhost:8000/docs

This is the Swagger UI / API documentation page.

You can use this page to:
- register apps
- start apps
- stop apps
- scale apps
- view cluster status
- check metrics

---

## 9) Optional: use the helper script

The project also has a helper script:

```bash
./start.sh
```

This script does a similar thing automatically and prints a summary after startup.

But for beginners, using the direct command is usually easier to understand:

```bash
docker compose up --build -d
```

---

## 10) Stop the project when you are done

From the Ubuntu terminal run:

```bash
docker compose down
```

This stops all the containers.

If you want to stop everything completely and remove old data as well:

```bash
docker compose down --remove-orphans -v
```

Use this carefully because it removes volumes and may reset the database.

---

## 11) If something is not working

### A) Docker Desktop is not running
- Open Docker Desktop
- Wait until it is fully running
- Then rerun:

```bash
docker compose up --build -d
```

### B) Old containers are still there
Try:

```bash
docker compose down --remove-orphans
```
Then start again:

```bash
docker compose up --build -d
```

### C) The cluster is still starting
Check logs:

```bash
docker compose logs -f
```

This shows what the project is doing.

### D) You are in the wrong terminal
Make sure you are in the Ubuntu terminal inside VS Code, not inside a Docker container shell.

---

## 12) What each app is used for

### Docker Desktop
- Starts the Docker engine
- Runs all containers in the background
- Shows the running containers

### VS Code Ubuntu terminal
- Used to run the commands
- Used to start and stop the project
- Used to check status with curl and docker commands

### Swagger UI at localhost:8000/docs
- Used to test the application APIs visually
- Good for app registration, startup, scaling, and health checks

---

## 13) Most common commands to remember

Start project:

```bash
docker compose up --build -d
```

Check status:

```bash
docker compose ps
```

See logs:

```bash
docker compose logs -f
```

Stop project:

```bash
docker compose down
```

Check app health:

```bash
curl http://localhost:8000/cluster/health
```

Open Swagger UI:

```text
http://localhost:8000/docs
```

---

## 14) Short version

If you want the shortest working flow, do this:

1. Start Docker Desktop
2. Open VS Code
3. Open Ubuntu terminal in VS Code
4. Run:

```bash
cd /mnt/d/MAJOR\ PROJECT/Orchestry
docker compose up --build -d
```

5. Wait a few minutes
6. Open:

```text
http://localhost:8000/docs
```

7. To stop:

```bash
docker compose down
```

---

## 15) Quick recap

This project is a Docker-based distributed system. The main idea is simple:
- Docker Desktop = machine power
- Ubuntu terminal in VS Code = command center
- docker compose = start/stop the whole system
- Swagger UI = control panel for testing

For detailed, step-by-step examples covering all 17 user-facing operations,
see the [Dashboard and Swagger examples](docs/user-guide/dashboard-and-swagger-examples.md).
