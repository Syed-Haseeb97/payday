import os
import zipfile
import shutil

project_dir = r"D:\projects\codebenders_Hackathon"
zip_full_path = r"D:\projects\payday-review.zip"
zip_full_copy = r"D:\projects\codebenders_Hackathon\payday-review.zip"
zip_code_only = r"D:\projects\payday-review-code-only.zip"

# 1. Delete old zips
for z in [zip_full_path, zip_full_copy, zip_code_only]:
    if os.path.exists(z):
        try:
            os.remove(z)
            print(f"Deleted old archive: {z}")
        except Exception as e:
            print(f"Error removing {z}: {e}")

# Excluded heavy directories and files
exclude_dirs = {
    ".git",
    "node_modules",
    ".next",
    ".vercel",
    "test-results",
    "playwright-report",
    "brag-output",
    ".hyperframes",
    "__pycache__",
}

exclude_files = {
    "payday-review.zip",
    "payday-review-code-only.zip",
    "tsconfig.tsbuildinfo",
    ".DS_Store",
    "Thumbs.db",
}

sanitized_env_local = """# Supabase Postgres Configuration
SUPABASE_URL="https://blah-blah.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="blah blah"

# Primary AI / LLM Configuration (Groq Cloud)
LLM_BASE_URL="https://api.groq.com/openai/v1"
LLM_API_KEY="blah blah"
LLM_MODEL="qwen/qwen3.8-27b"

# Fallback AI / LLM Configuration (OpenRouter)
LLM_FALLBACK_BASE_URL="https://openrouter.ai/api/v1"
LLM_FALLBACK_API_KEY="blah blah"
LLM_FALLBACK_MODEL="particle-ai/particle-1:free"

# Demo Reset Control
NEXT_PUBLIC_DEMO_RESET=true

# Vercel Configuration
VERCEL_OIDC_TOKEN="blah blah"
"""

sanitized_env_example = """# Supabase Postgres Configuration
SUPABASE_URL="https://blah-blah.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="blah blah"

# AI / LLM Configuration (OpenAI-compatible)
LLM_BASE_URL="https://api.groq.com/openai/v1"
LLM_API_KEY="blah blah"
LLM_MODEL="qwen/qwen3.8-27b"
LLM_FALLBACK_MODEL="particle-ai/particle-1:free"

# Demo Reset Control
NEXT_PUBLIC_DEMO_RESET=true
"""

def create_archive(target_zip, include_video=True):
    with zipfile.ZipFile(target_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for root, dirs, files in os.walk(project_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            rel_dir = os.path.relpath(root, project_dir)
            if rel_dir == ".":
                rel_dir = ""

            for file in files:
                if file in exclude_files:
                    continue
                if file.endswith(".zip") or file.endswith(".tsbuildinfo"):
                    continue
                if not include_video and file.endswith(".mp4"):
                    continue

                full_path = os.path.join(root, file)
                archive_name = os.path.normpath(os.path.join(rel_dir, file)).replace("\\", "/")

                if file == ".env.local":
                    z.writestr(archive_name, sanitized_env_local)
                elif file == ".env.example":
                    z.writestr(archive_name, sanitized_env_example)
                elif file == ".env":
                    z.writestr(archive_name, sanitized_env_local)
                else:
                    z.write(full_path, archive_name)

print("Building main review archive with demo video...")
create_archive(zip_full_path, include_video=True)
shutil.copy2(zip_full_path, zip_full_copy)

print("Building code-only review archive without mp4...")
create_archive(zip_code_only, include_video=False)

def report(path):
    size_b = os.path.getsize(path)
    if size_b > 1024 * 1024:
        print(f"  {path}: {size_b / (1024 * 1024):.2f} MB ({size_b:,} bytes)")
    else:
        print(f"  {path}: {size_b / 1024:.2f} KB ({size_b:,} bytes)")

print("\nArchives successfully generated:")
report(zip_full_path)
report(zip_full_copy)
report(zip_code_only)
