/**
 * LiquidGov Cross-Platform System Tray and Daemon Controller
 * Provides operational hooks for starting, stopping, checking status,
 * viewing live logs, and shutting down background service instances.
 */

import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const PID_FILE = path.resolve(__dirname, '../.daemon.pid');
const LOG_FILE = path.resolve(__dirname, '../daemon.log');

export class DaemonController {
  static getStatus(): { running: boolean; pid?: number } {
    if (!fs.existsSync(PID_FILE)) {
      return { running: false };
    }
    const pidStr = fs.readFileSync(PID_FILE, 'utf-8').trim();
    const pid = parseInt(pidStr, 10);
    if (isNaN(pid)) {
      return { running: false };
    }

    try {
      // Process probe across platforms
      process.kill(pid, 0);
      return { running: true, pid };
    } catch {
      // Stale pid file
      fs.unlinkSync(PID_FILE);
      return { running: false };
    }
  }

  static startDaemon() {
    const status = this.getStatus();
    if (status.running) {
      console.log(`[DaemonController] Daemon is already running with PID ${status.pid}`);
      return;
    }

    console.log('[DaemonController] Launching LiquidGov backend daemon...');
    const outStream = fs.openSync(LOG_FILE, 'a');
    const child = spawn('npx', ['ts-node', 'src/cli/simulate.ts'], {
      detached: true,
      stdio: ['ignore', outStream, outStream],
      cwd: path.resolve(__dirname, '..'),
    });

    if (child.pid) {
      fs.writeFileSync(PID_FILE, child.pid.toString());
      child.unref();
      console.log(`[DaemonController] Started daemon successfully with PID ${child.pid}`);
      console.log(`[DaemonController] Log file: ${LOG_FILE}`);
    }
  }

  static stopDaemon() {
    const status = this.getStatus();
    if (!status.running || !status.pid) {
      console.log('[DaemonController] Daemon is not currently active.');
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
      return;
    }

    console.log(`[DaemonController] Terminating daemon process PID ${status.pid}...`);
    try {
      process.kill(status.pid, 'SIGTERM');
      console.log('[DaemonController] Terminated successfully.');
    } catch (e: any) {
      console.error(`[DaemonController] Error terminating process: ${e.message}`);
    } finally {
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
    }
  }

  static restartDaemon() {
    console.log('[DaemonController] Restarting daemon...');
    this.stopDaemon();
    setTimeout(() => {
      this.startDaemon();
    }, 1000);
  }

  static showLogs(lines: number = 20) {
    if (!fs.existsSync(LOG_FILE)) {
      console.log('[DaemonController] No log file exists yet.');
      return;
    }
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const allLines = content.split('\n');
    const slice = allLines.slice(-lines);
    console.log(`--- LAST ${lines} LINES OF DAEMON LOG ---`);
    console.log(slice.join('\n'));
    console.log('-----------------------------------------');
  }

  static interactiveMenu() {
    console.log('\n=== LiquidGov System Tray Controller ===');
    const status = this.getStatus();
    console.log(`Status: ${status.running ? `RUNNING (PID ${status.pid})` : 'STOPPED'}`);
    console.log('1. Start Daemon');
    console.log('2. Stop Daemon');
    console.log('3. Restart Daemon');
    console.log('4. Show Status');
    console.log('5. View Recent Logs');
    console.log('6. Exit');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('\nSelect an option (1-6): ', (answer) => {
      rl.close();
      switch (answer.trim()) {
        case '1':
          DaemonController.startDaemon();
          break;
        case '2':
          DaemonController.stopDaemon();
          break;
        case '3':
          DaemonController.restartDaemon();
          break;
        case '4':
          const current = DaemonController.getStatus();
          console.log(`Daemon status: ${current.running ? `ACTIVE (PID ${current.pid})` : 'INACTIVE'}`);
          break;
        case '5':
          DaemonController.showLogs(30);
          break;
        case '6':
          console.log('Exiting controller.');
          process.exit(0);
        default:
          console.log('Invalid option.');
      }
    });
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'menu') {
    DaemonController.interactiveMenu();
  } else if (command === 'start') {
    DaemonController.startDaemon();
  } else if (command === 'stop') {
    DaemonController.stopDaemon();
  } else if (command === 'restart') {
    DaemonController.restartDaemon();
  } else if (command === 'status') {
    const s = DaemonController.getStatus();
    console.log(`Status: ${s.running ? `RUNNING (PID ${s.pid})` : 'STOPPED'}`);
  } else if (command === 'logs') {
    const lines = args[1] ? parseInt(args[1], 10) : 25;
    DaemonController.showLogs(lines);
  } else {
    console.log(`Unknown command: ${command}`);
    console.log('Usage: npx ts-node scripts/tray.ts [start|stop|restart|status|logs|menu]');
  }
}
