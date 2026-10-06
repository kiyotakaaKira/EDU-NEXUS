import sys
import time
import threading
import subprocess
import os

def animated_loading():
    chars = ["-", "\\", "|", "/"]
    stages = [
        "Initializing Project Report Compiler...",
        "Parsing Markdown files (Front Matter, Ch 1-8)...",
        "Loading Mathematical Equations...",
        "Rendering Tables and ML Performance Metrics...",
        "Applying Academic Styling (Margins, Fonts)...",
        "Generating Table of Contents...",
        "Compiling PDF Binary...",
        "Finalizing Document Generation..."
    ]
    
    global done
    done = False
    
    print("\n\033[96m[ SENTINAL D: EduPredict AI - Report Generator ]\033[0m\n")
    
    step_duration = 3  # seconds per stage roughly
    for stage in stages:
        for i in range(step_duration * 10):
            if done:
                break
            sys.stdout.write(f"\r\033[93m{chars[i % len(chars)]}\033[0m {stage} ")
            sys.stdout.flush()
            time.sleep(0.1)
        if done:
            break
        sys.stdout.write(f"\r\033[92m[OK]\033[0m {stage}\n")
        
    while not done:
        for char in chars:
            if done:
                break
            sys.stdout.write(f"\r\033[93m{char}\033[0m Waiting for PDF Engine (Chromium)... ")
            sys.stdout.flush()
            time.sleep(0.1)

def run_compiler():
    global done
    cwd = r"c:\Users\adijd\OneDrive\Desktop\DASHBOARD\Project\PBL DS\EDUNEXUS\EDUNEXUS\final_report"
    # Actually run the md-to-pdf compiler synchronously here
    subprocess.run(["npx.cmd", "-y", "md-to-pdf", "FINAL_ML_PROJECT_REPORT.md"], cwd=cwd, shell=True, capture_output=True)
    done = True

def main():
    t_compile = threading.Thread(target=run_compiler)
    t_compile.start()
    
    animated_loading()
    
    t_compile.join()
    
    sys.stdout.write(f"\r\033[92m[OK]\033[0m PDF Generation Completed!               \n\n")
    sys.stdout.write("\033[92mSuccessfully saved to: final_report/FINAL_ML_PROJECT_REPORT.pdf\033[0m\n")

if __name__ == "__main__":
    # Windows ANSI support
    os.system('color')
    main()
