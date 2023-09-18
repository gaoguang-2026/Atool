
@echo off  
dir       

@echo 'ensure pip...'
python -m ensurepip --upgrade 

@echo 'install selenium...'
pip install selenium
@echo 'install pywin32...'
pip install pywin32

@echo 'start taobao ...'
python .\taobao.py

#@echo 'start request ...'
#python .\req.py

pause      
