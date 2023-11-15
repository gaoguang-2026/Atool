# coding=utf-8
import datetime
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
import win32com.client

speaker = win32com.client.Dispatch("SAPI.SpVoice")

times = '2023-11-15 16:04:00'

browser = webdriver.Chrome()
browser.maximize_window()

browser.get("https://www.taobao.com")
time.sleep(3)
browser.find_element(By.LINK_TEXT, "亲，请登录").click()
speaker.Speak("请扫码")
time.sleep(15)

browser.get("https://cart.taobao.com/cart.htm")
time.sleep(5)

while True:
    if browser.find_element(By.ID,"J_SelectAll1"):
         browser.find_element(By.ID,"J_SelectAll1").click()
         break

time.sleep(1)

while True:

    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')

    print(now)

    if now > times:
        while 1==1:
            try:
                if browser.find_element(By.LINK_TEXT,"结 算"):
                    print(f"结 算")
                    browser.find_element(By.LINK_TEXT,"结 算").click()
                    break
            except: 
                pass   

        while 1==1:
            try:
                if browser.find_element(By.LINK_TEXT,"提交订单"):
                    print(f"提交订单")
                    browser.find_element(By.LINK_TEXT,"提交订单").click()
                    speaker.Speak("主人,结算提交成功,我已帮你抢到商品啦,请及时支付订单")
                    break
            except: 
                pass