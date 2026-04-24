from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import market, predict, search, news, portfolio, advisor, auth

app = FastAPI()

default_origins = "http://localhost:3000,http://127.0.0.1:3000"
raw_origins = os.getenv("CORS_ORIGINS", default_origins)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router)
app.include_router(predict.router)
app.include_router(search.router)
app.include_router(news.router)          # ← added
app.include_router(portfolio.router)     # ← added
app.include_router(advisor.router)       # ← added
app.include_router(auth.router)
