/* global ActiveXObject */ ;
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		root.request = factory();
	}
})(window, function () {

	function createXHR() {
		if (typeof XMLHttpRequest != 'undefined') {
			createXHR = function () {
				return new XMLHttpRequest();
			};
		} else if (typeof ActiveXObject != 'undefined') {
			createXHR = function () {
				if (typeof arguments.callee.activeXString != 'string') {
					var versions = ['MSXML2.XMLHttp.6.0', 'MSXML2.XMLHttp.3.0',
							'MSXML2.XMLHttp'
						],
						i, len;
					for (i = 0, len = versions.length; i < len; ++i) {
						try {
							new ActiveXObject(versions[i]);
							arguments.callee.activeXString = versions[i];
							break;
						} catch (e) {}
					}
					return new ActiveXObject(arguments.callee.activeXString);
				}
			};
		} else {
			createXHR = function () {
				throw new Error('No XHR object available.');
			};
		}
		return createXHR();
	}

	function stringify(obj, encode) {
		var entries = [],
			key;
		if (encode) {
			for (key in obj) {
				entries.push(key + '=' + encodeURIComponent(obj[key]));
			}
		} else {
			for (key in obj) {
				entries.push(key + '=' + obj[key]);
			}
		}
		return entries.join('&');
	}

	var headerMap = {
		json: 'application/json',
		form: 'application/x-www-form-urlencoded',
		html: 'text/html',
		xml: 'application/xml',
		text: 'text/plain'
	};

	function request(opts) {
		/**
		 * url,
		 * method,
		 * headers,
		 * data,
		 * contentType 'application/json',
		 * dataType 'json'
		 * accept 'application/json',
		 * timeout,
		 * async flag,
		 * withCredentials false
		 * success(data, status, xhr),
		 * error(xhr, status, err),
		 * complete(xhr, status),
		 * ontimeout(err, xhr)
		 * beforeSend(xhr)
		 */
		var url = opts.url,
			method = opts.method && opts.method.toLowerCase() || 'get',
			data = opts.data || null,
			contentType = opts.contentType ||
			'application/x-www-form-urlencoded; charset=UTF-8',
			dataType = opts.dataType,
			accept = opts.accept || 'application/json',
			headers = opts.headers || {
				'Content-Type': contentType,
				'Accept': accept
			},
			timeout = opts.timeout,
			async = typeof opts.async != 'undefined' ? opts.async : true,
			withCredentials = opts.withCredentials || false,
			success = opts.success || function () {},
			error = opts.error || function () {},
			complete = opts.complete || function () {},
			ontimeout = opts.ontimeout || function () {},
			beforeSend = opts.beforeSend;

		var xhr = createXHR();

		xhr.onreadystatechange = function () {
			var data = null;
			if (xhr.readyState === 4) {
				if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
					if (dataType === 'json') {
						data = JSON.parse(xhr.responseText);
					} else {
						try {
							data = JSON.parse(xhr.responseText);
						} catch (e) {
							data = xhr.responseText;
						}
					}
					success(data, xhr.status, xhr);
				} else {
					var e = new Error(xhr.responseText);
					error(xhr, xhr.status, e);
				}
				complete(xhr, xhr.status);
			}
		};
		
		xhr.onerror = function (e) {
			error(xhr, xhr.status, e);
			complete(xhr, xhr.status);
		};

		xhr.withCredentials = withCredentials;
		
		if (timeout) {
			xhr.timeout = timeout;
			xhr.ontimeout = function (e) {
				ontimeout(e, xhr);
				complete(xhr, xhr.status);
			};
		}

		xhr.open(method, url, async);

		for (var key in headers) {
			xhr.setRequestHeader(key, headers[key]);
		}

		if (typeof beforeSend === 'function') {
			beforeSend(xhr);
		}

		if (method === 'post' || method === 'put') {
			if (typeof data === 'string' ||
				data instanceof FormData ||
				data instanceof Blob ||
				data instanceof ArrayBuffer ||
				data instanceof Document) {
				xhr.send(data);
			} else if (typeof data === 'object') {
				if (contentType.indexOf('json') !== -1) {
					xhr.send(JSON.stringify(data));
				} else {
					xhr.send(stringify(data, true));
				}
			} else {
				throw new Error('You must set a proper data.');
			}
		} else {
			xhr.send(null);
		}
	}

	/**
	 * request.get(url, opts, callback)
	 * request.get(url, callback)
	 */
	request.get = function (arg0, arg1, arg2) {
		var url, params, callback;
		if (typeof arg2 === 'function') {
			params = arg1, callback = arg2;
		} else if (typeof arg1 === 'function') {
			callback = arg1;
		}
		url = arg0;
		if (params) {
			if (url.indexOf('?') != -1) {
				url += '&' + stringify(params, true);
			} else {
				url += '?' + stringify(params, true);
			}
		}
		request({
			url: url,
			method: 'get',
			success: function (data, status, xhr) {
				callback(null, data, xhr);
			},
			error: function (xhr, status, err) {
				callback(err, null, xhr);
			}
		});
	};


	/**
	 * request.delete(url, opts, callback)
	 * request.delete(url, callback)
	 */
	request.delete = function (arg0, arg1, arg2) {
		var url, params, callback;
		if (typeof arg2 === 'function') {
			params = arg1, callback = arg2;
		} else if (typeof arg1 === 'function') {
			callback = arg1;
		}
		url = arg0;
		if (params) {
			if (url.indexOf('?') != -1) {
				url += '&' + stringify(params, true);
			} else {
				url += '?' + stringify(params, true);
			}
		}
		request({
			url: url,
			method: 'delete',
			success: function (data, status, xhr) {
				callback(null, data, xhr);
			},
			error: function (xhr, status, err) {
				callback(err, null, xhr);
			}
		});
	};

	request.post = function (url, params, callback) {
		request({
			url: url,
			data: params,
			method: 'post',
			success: function (data, status, xhr) {
				callback(null, data, xhr);
			},
			error: function (xhr, status, err) {
				callback(err, null, xhr);
			}
		});
	};
	
	request.put = function (url, params, callback) {
		request({
			url: url,
			data: params,
			method: 'put',
			success: function (data, status, xhr) {
				callback(null, data, xhr);
			},
			error: function (xhr, status, err) {
				callback(err, null, xhr);
			}
		});
	};

	return request;
});