import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private secretKey = 'sahosoftstream123'; // Replace with your secret key
  setStorage(key: string, value: any){
    if(typeof value != 'string'){
      value = value?.toString();
    }
    const encryptedValue = CryptoJS.AES.encrypt(value, this.secretKey).toString();
    localStorage.setItem(key, encryptedValue);
  }
  getStorage(key:string){
    const encryptedValue = localStorage.getItem(key);
    if (encryptedValue) {
      const decryptedValue = CryptoJS.AES.decrypt(encryptedValue, this.secretKey).toString(CryptoJS.enc.Utf8);
      return decryptedValue;
    }
    return null;
    
  }

}
