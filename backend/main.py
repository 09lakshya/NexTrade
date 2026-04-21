from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import market, predict, search, news, portfolio, advisor, auth

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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