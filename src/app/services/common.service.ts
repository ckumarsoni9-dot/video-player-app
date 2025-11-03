import { Injectable, signal } from '@angular/core';
import { HttpService } from './http.service';
import { CryptoService } from './crypto.service';
import { BehaviorSubject, catchError, debounceTime, EMPTY, flatMap, forkJoin, map, Observable, of, Subject, switchMap, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Interfaces for type safety
interface UserDetails {
  userId: string;
}

interface AppInfo {
  hwuuid: string;
  ostype: string;
  app_ver: string;
}

interface AppDetail {
  deviceId: string;
  app_Version: string;
  logoutStatus: number;
  isIndividualForceLogout: number;
  individualLogoutStatus: number;
  id: number;
}

interface SystemDetail {
  name: string;
  version: string;
  appLink: string;
  isForceUpdate: number;
  remark: string;
  isForceLogout: number;
}
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  scrollDownPos = signal(false);
  isVideoPlayed = signal(false);
  apiError = signal(false);
  private isForceUpdateDataSubject = new BehaviorSubject<any>(
    {
      appLink: '',
      isForceUpdate: false,
      isUpdateAvailable: false,
      userAppVer: 0,
      currentVer: 0,
      remark: '',
      version: 0
    }
  );
  private isForceLogutSubject = new Subject<any>();

  public isForceUpdateData$ = this.isForceUpdateDataSubject.asObservable();
  public isForceLogut$ = this.isForceLogutSubject.asObservable();

  showMaterialNo = signal(localStorage.getItem('SMN'));


  constructor(private _https: HttpService, private _crypto: CryptoService,
    private _http: HttpClient
  ) {


    setInterval(() => {
      this.checkForForceLogout();
    }, 60000);
  }

  // Registration_Users/GetUserByEmailId
  getUserByEmailId(data: any) {
    return this._https.get("https://sahosoft.co.in/api/sahosoft/Registration_Users/GetUserByEmailId/" + data.email);

  }

  checkForForceLogout() {
    // Reset the force logout subject
    // this.isForceLogutSubject.next(null);

    // Initialize variables
    let objUserAppDetails = [];
    let objLatestApps = null;

    // Retrieve user and app details from storage
    let userDetails = JSON.parse(this._crypto.getStorage("SYSUSER_DT"));
    let app_info = JSON.parse(this._crypto.getStorage("APP_INFO"));
    if (!userDetails)
      return;

    // Fetch user application details by user ID
    this._https.post("https://sahosoft.co.in/api/sahosoft/Stream_OnlineVideoClass_DesktopApp/GetByUserId", { userId: userDetails.userId }).subscribe(res => {
      if (res.data.length > 0) {
        // Filter details based on device ID
        objUserAppDetails = res.data.filter(x => x.deviceId == app_info.hwuuid);

        let userAppVer = parseFloat(res.data.filter(x => x.deviceId == app_info.hwuuid)[0].app_Version);

        //  userAppVer = 0.1

        // Fetch system details
        this._https.get("https://sahosoft.co.in/api/sahosoft/MyClass_PlayOnlinePaidVideo/GetSystemDetails").subscribe(res => {
          if (res.isSuccess) {
            // Find the latest app details for the OS type
            objLatestApps = res.data.find(x => x.name == app_info.ostype);
            // Handle force logout
            if (objLatestApps.isForceLogout == 1 && objUserAppDetails[0].logoutStatus == 0) {
              this.isForceLogutSubject.next({
                isForceLogout: true,
                isIndividualForceLogout: false,
                id: objUserAppDetails[0].id
              });
            } else {
              this.isForceLogutSubject.next({
                isForceLogout: false,
                isIndividualForceLogout: false,
                id: objUserAppDetails[0].id
              });
            }

            // Handle individual force logout
            if (objUserAppDetails[0].isIndividualForceLogout == 1 && objUserAppDetails[0].individualLogoutStatus == 0) {
              this.isForceLogutSubject.next({
                isForceLogout: false,
                isIndividualForceLogout: true,
                id: objUserAppDetails[0].id
              });
            } else {
              this.isForceLogutSubject.next({
                isForceLogout: false,
                isIndividualForceLogout: false,
                id: objUserAppDetails[0].id
              });
            }
          }
        });
      }
    });
  }

  getPlayerPanalInItData(): Observable<any> {
    const courseData = JSON.parse(this._crypto.getStorage('courseData'));
    const userDetails = JSON.parse(this._crypto.getStorage('SYSUSER_DT'));


    let obj: any = {
      courseId: courseData.itemId,
      batchId: courseData.batchId
    }
    let apiPath = "";
    if (courseData.itemTypeId == 2) {
      apiPath = "Course_PaidVideocourses_CourseChapterTopic/GetTopicByCourseAndBatch";
    } else {
      obj = {
        ...obj,
        userId: userDetails.userId,
      }

      apiPath = "Course_PaidVideocourses_CourseChapterTopic/GetTopicByUserAndBatch";
    }

    return forkJoin([
      this._https.post(`https://sahosoft.co.in/api/myclass/MyClass_PlayOnlinePaidVideo/PlayOnlinePaidVideoGetByUserId`, { userId: userDetails.userId }),

      this._http.post("https://sahosoft.co.in/api/sahosoft/" + apiPath, obj)
    ]).pipe(
      switchMap(([userData, topicData]: any) => {
        if (!userData.isSuccess || !topicData.isSuccess) {
          // Handle error or return empty object
          return EMPTY; // Replace with appropriate error handling
        }
        const selectedTopics = topicData.data.slice(0, this.showMaterialNo());
        return this._https.get(`https://sahosoft.co.in/api/sahosoft/Course_PaidVideocourses_CourseChapterTopic/GetUrlName_ByClassTimeTableId/${selectedTopics[0].classTimeTableId}`).pipe(
          map((classTimeTableData: any) => {
            if (!classTimeTableData.isSuccess) {
              // Handle error or return empty object
              return {}; // Replace with appropriate error handling
            }
            return {
              data: userData.data,
              topicData: selectedTopics,
              classTimeTableData: classTimeTableData.data
            };
          }),
          catchError(error => {
            console.error(error);
            return EMPTY; // Handle error appropriately
          })
        );
      }),
      catchError(error => {
        console.error(error);
        return EMPTY; // Handle error appropriately
      })
    );
  }
}
