import asyncio
import os
import sys

backend_dir = '/Users/jusang/Documents/carrot-market-backend'
sys.path.append(backend_dir)
os.chdir(backend_dir)

from app.database import get_db, SessionLocal
from app.crud.domain import get_chat_room

async def test():
    async with SessionLocal() as db:
        room = await get_chat_room(db, '526a7627-7b53-42d9-bada-b1f8ddca8863')
        if not room:
            print('Room not found')
            return
        
        try:
            from app.schemas.domain import ChatRoomDetailResponse
            response = ChatRoomDetailResponse.model_validate(room)
            print('Success!', response.model_dump_json(indent=2))
        except Exception as e:
            import traceback
            traceback.print_exc()
            print('ValidationError or MissingGreenlet:', e)

asyncio.run(test())
