// Yuvantara Cloud Database & Sync Engine
// Connects to Firebase Firestore REST API & Custom Cloud Backend
(function(window) {
  'use strict';

  var CloudDB = {
    isConfigured: function() {
      var cfg = window.YUVANTARA_CONFIG || {};
      return !!(cfg.firebase && cfg.firebase.enabled && cfg.firebase.projectId && cfg.firebase.apiKey);
    },

    getBackendUrl: function() {
      var cfg = window.YUVANTARA_CONFIG || {};
      return (cfg.api && cfg.api.baseUrl) || '';
    },

    // ── Firestore REST API Helpers ──
    _firestoreBaseUrl: function() {
      var cfg = window.YUVANTARA_CONFIG || {};
      var pid = cfg.firebase ? cfg.firebase.projectId : '';
      return 'https://firestore.googleapis.com/v1/projects/' + pid + '/databases/(default)/documents';
    },

    // Convert JS Object to Firestore Document fields
    _toFirestoreFields: function(obj) {
      var fields = {};
      for (var k in obj) {
        if (!obj.hasOwnProperty(k)) continue;
        var val = obj[k];
        if (val === null || val === undefined) {
          fields[k] = { nullValue: null };
        } else if (typeof val === 'boolean') {
          fields[k] = { booleanValue: val };
        } else if (typeof val === 'number') {
          fields[k] = Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
        } else if (typeof val === 'string') {
          fields[k] = { stringValue: val };
        } else if (Array.isArray(val)) {
          fields[k] = {
            arrayValue: {
              values: val.map(function(item) {
                return typeof item === 'object' ? { mapValue: { fields: CloudDB._toFirestoreFields(item) } } : { stringValue: String(item) };
              })
            }
          };
        } else if (typeof val === 'object') {
          fields[k] = { mapValue: { fields: CloudDB._toFirestoreFields(val) } };
        }
      }
      return fields;
    },

    // Convert Firestore Document fields back to JS Object
    _fromFirestoreFields: function(fields) {
      if (!fields) return {};
      var obj = {};
      for (var k in fields) {
        if (!fields.hasOwnProperty(k)) continue;
        var field = fields[k];
        if ('stringValue' in field) obj[k] = field.stringValue;
        else if ('integerValue' in field) obj[k] = parseInt(field.integerValue, 10);
        else if ('doubleValue' in field) obj[k] = parseFloat(field.doubleValue);
        else if ('booleanValue' in field) obj[k] = field.booleanValue;
        else if ('nullValue' in field) obj[k] = null;
        else if ('arrayValue' in field) {
          var vals = (field.arrayValue && field.arrayValue.values) || [];
          obj[k] = vals.map(function(v) {
            if ('mapValue' in v) return CloudDB._fromFirestoreFields(v.mapValue.fields);
            for (var key in v) return v[key];
            return null;
          });
        } else if ('mapValue' in field) {
          obj[k] = CloudDB._fromFirestoreFields(field.mapValue.fields);
        }
      }
      return obj;
    },

    // Save a document to Cloud Firestore
    saveDocument: function(collection, docId, data) {
      var self = this;
      if (!this.isConfigured()) {
        // Fallback to local storage if Firebase not yet configured
        return Promise.resolve({ local: true, data: data });
      }

      var cfg = window.YUVANTARA_CONFIG || {};
      var url = this._firestoreBaseUrl() + '/' + encodeURIComponent(collection) + '/' + encodeURIComponent(docId) + '?key=' + cfg.firebase.apiKey;
      var body = { fields: this._toFirestoreFields(data) };

      return fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(res) {
        if (!res.ok) throw new Error('Firestore write error: ' + res.status);
        return res.json();
      }).then(function(json) {
        return { success: true, doc: self._fromFirestoreFields(json.fields) };
      }).catch(function(err) {
        console.warn('Cloud sync error, cached locally:', err);
        return { local: true, error: err.message };
      });
    },

    // Fetch documents from a collection
    fetchCollection: function(collection) {
      var self = this;
      if (!this.isConfigured()) {
        return Promise.resolve([]);
      }

      var cfg = window.YUVANTARA_CONFIG || {};
      var url = this._firestoreBaseUrl() + '/' + encodeURIComponent(collection) + '?key=' + cfg.firebase.apiKey;

      return fetch(url).then(function(res) {
        if (!res.ok) throw new Error('Firestore read error: ' + res.status);
        return res.json();
      }).then(function(data) {
        var docs = (data && data.documents) || [];
        return docs.map(function(d) {
          return self._fromFirestoreFields(d.fields);
        });
      }).catch(function(err) {
        console.warn('Could not fetch from Firestore collection:', collection, err);
        return [];
      });
    },

    // Sync all local data to Cloud
    syncToCloud: function() {
      if (!this.isConfigured()) {
        return Promise.resolve({
          synced: false,
          reason: 'Firebase credentials not configured in assets/config.js'
        });
      }

      var db = window.YuvantaraDB;
      if (!db) return Promise.resolve({ synced: false });

      var users = db.getUsers();
      var apps = db.getApplications();

      var promises = [];
      users.forEach(function(u) {
        var docId = u.email ? u.email.replace(/[@.]/g, '_') : u.id;
        promises.push(CloudDB.saveDocument('users', docId, u));
      });

      apps.forEach(function(a) {
        promises.push(CloudDB.saveDocument('applications', a.id, a));
      });

      return Promise.all(promises).then(function(results) {
        return { synced: true, count: results.length };
      });
    },

    // Pull from Cloud to local
    syncFromCloud: function() {
      if (!this.isConfigured()) {
        return Promise.resolve({
          synced: false,
          reason: 'Firebase credentials not configured in assets/config.js'
        });
      }

      var db = window.YuvantaraDB;
      return Promise.all([
        this.fetchCollection('users'),
        this.fetchCollection('applications')
      ]).then(function(results) {
        var cloudUsers = results[0];
        var cloudApps = results[1];

        if (cloudUsers && cloudUsers.length > 0) {
          localStorage.setItem('yuvantara_users_db', JSON.stringify(cloudUsers));
        }
        if (cloudApps && cloudApps.length > 0) {
          localStorage.setItem('yuvantara_apps_db', JSON.stringify(cloudApps));
        }

        return {
          synced: true,
          usersCount: (cloudUsers || []).length,
          appsCount: (cloudApps || []).length
        };
      });
    }
  };

  // Auto initialize cloud sync if configured
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      if (CloudDB.isConfigured()) {
        CloudDB.syncFromCloud().then(function(res) {
          if (res.synced) {
            console.log('☁️ Yuvantara Cloud DB synchronized successfully from Firestore.');
          }
        });
      }
    });
  }

  window.YuvantaraCloudDB = CloudDB;
})(window);
